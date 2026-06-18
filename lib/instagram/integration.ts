import {
  INSTAGRAM_INTEGRATION_PROVIDER,
  parseInstagramIntegrationMetadata,
  type InstagramIntegrationMetadata,
} from "@/lib/instagram/constants";
import { validateInstagramCredentials } from "@/lib/instagram/graph";
import {
  getInstagramAccessToken,
  isInstagramIntegrationConfigured,
} from "@/lib/instagram/oauth";
import type { IntegrationStatus } from "@/lib/integrations/constants";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SaveInstagramConnectionInput = {
  pageId?: string;
  pageName?: string;
  pageAccessToken: string;
  instagramBusinessAccountId: string;
  instagramUsername?: string;
  connectionMethod: "oauth" | "manual";
};

export function resolveInstagramIntegrationStatus(
  storedStatus: string,
  metadata: InstagramIntegrationMetadata,
): IntegrationStatus {
  if (isInstagramIntegrationConfigured(metadata)) {
    return "connected";
  }

  if (storedStatus === "pending_setup") {
    return "pending_setup";
  }

  return "not_connected";
}

export async function saveInstagramConnection(
  supabase: SupabaseServerClient,
  organizationId: string,
  input: SaveInstagramConnectionInput,
) {
  const account = await validateInstagramCredentials(
    input.pageAccessToken,
    input.instagramBusinessAccountId,
  );

  const now = new Date().toISOString();
  const username = input.instagramUsername || account.username || null;

  const metadata: InstagramIntegrationMetadata = {
    pageId: input.pageId,
    pageName: input.pageName,
    pageAccessToken: input.pageAccessToken,
    instagramBusinessAccountId: input.instagramBusinessAccountId,
    instagramUsername: username ?? undefined,
    username: username ?? undefined,
    followersCount: account.followers_count ?? 0,
    businessAccountStatus: "instagram_basic_connected",
    connectedAccount:
      input.pageName ?? account.name ?? username ?? input.instagramBusinessAccountId,
    connectionMethod: input.connectionMethod,
    instagramManageInsightsGranted: false,
  };

  const { error: integrationError } = await supabase.from("integrations").upsert(
    {
      organization_id: organizationId,
      provider: INSTAGRAM_INTEGRATION_PROVIDER,
      status: "connected",
      metadata,
      updated_at: now,
    },
    { onConflict: "organization_id,provider" },
  );

  if (integrationError) {
    throw new Error(integrationError.message);
  }

  await supabase.from("instagram_account_stats").upsert(
    {
      organization_id: organizationId,
      instagram_business_account_id: input.instagramBusinessAccountId,
      username,
      followers_count: account.followers_count ?? 0,
      updated_at: now,
    },
    { onConflict: "organization_id" },
  );

  return {
    username: username ?? "instagram",
    followersCount: account.followers_count ?? 0,
  };
}

export async function disconnectInstagramIntegration(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const now = new Date().toISOString();

  const { error } = await supabase.from("integrations").upsert(
    {
      organization_id: organizationId,
      provider: INSTAGRAM_INTEGRATION_PROVIDER,
      status: "not_connected",
      metadata: {},
      updated_at: now,
    },
    { onConflict: "organization_id,provider" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export function getInstagramCredentialsFromMetadata(metadata: unknown) {
  const parsed = parseInstagramIntegrationMetadata(metadata);
  const accessToken = getInstagramAccessToken(parsed);
  const instagramBusinessAccountId = parsed.instagramBusinessAccountId;

  if (!accessToken || !instagramBusinessAccountId) {
    return null;
  }

  return { accessToken, instagramBusinessAccountId, metadata: parsed };
}

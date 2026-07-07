import type { createClient } from "@/utils/supabase/server";

import {
  DEFAULT_AI_TIMEZONE,
  resolveLocaleFromCommunicationLanguage,
  type BuildRuntimeContextInput,
} from "@/modules/ai/runtime/build-runtime-context";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function resolveOrganizationTimezone(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<string> {
  const { data } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", organizationId)
    .maybeSingle();

  return data?.timezone?.trim() || DEFAULT_AI_TIMEZONE;
}

export async function resolveRuntimeContextInput(
  supabase: SupabaseServerClient,
  params: {
    organizationId: string;
    workspaceName?: string | null;
    currentUser?: string | null;
    businessName?: string | null;
    locale?: BuildRuntimeContextInput["locale"];
    communicationLanguage?: string | null;
  },
): Promise<BuildRuntimeContextInput> {
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, timezone")
    .eq("id", params.organizationId)
    .maybeSingle();

  const locale =
    params.locale ??
    resolveLocaleFromCommunicationLanguage(params.communicationLanguage);

  return {
    timezone: organization?.timezone,
    workspaceId: organization?.id ?? params.organizationId,
    workspaceName: params.workspaceName ?? organization?.name,
    currentUser: params.currentUser,
    businessName: params.businessName,
    locale,
  };
}

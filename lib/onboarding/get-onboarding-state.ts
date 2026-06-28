import {
  parseFirstRunSettings,
} from "@/lib/onboarding/settings";
import type { SolutionIndustry } from "@/lib/onboarding/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type OnboardingState = {
  hasOrganization: boolean;
  currentOrganizationId: string | null;
  organizationOnboardingCompleted: boolean;
  shouldCreateWorkspace: boolean;
  shouldRunFirstSetup: boolean;
  isOwner: boolean;
};

type OrganizationOnboardingRow = {
  id: string;
  onboarding_completed: boolean | null;
  industry: string | null;
  settings: unknown;
};

type OnboardingSupabaseClient = Pick<
  Awaited<ReturnType<typeof createClient>>,
  "from"
>;

type ProfileRow = {
  organization_id: string | null;
  role: string;
};

export function isOrganizationOnboardingCompleted(
  organization: OrganizationOnboardingRow,
): boolean {
  if (organization.onboarding_completed === true) {
    return true;
  }

  const firstRun = parseFirstRunSettings(
    (organization.settings as Record<string, unknown> | null)?.firstRun,
  );

  if (firstRun?.completedAt) {
    return true;
  }

  return false;
}

export function deriveOnboardingState(input: {
  organizationId: string | null;
  role: string;
  organization: OrganizationOnboardingRow | null;
}): OnboardingState {
  const isOwner = input.role === "owner";

  if (!input.organizationId) {
    return {
      hasOrganization: false,
      currentOrganizationId: null,
      organizationOnboardingCompleted: false,
      shouldCreateWorkspace: true,
      shouldRunFirstSetup: false,
      isOwner,
    };
  }

  if (!input.organization) {
    return {
      hasOrganization: true,
      currentOrganizationId: input.organizationId,
      organizationOnboardingCompleted: false,
      shouldCreateWorkspace: false,
      shouldRunFirstSetup: isOwner,
      isOwner,
    };
  }

  const organizationOnboardingCompleted = isOrganizationOnboardingCompleted(
    input.organization,
  );

  return {
    hasOrganization: true,
    currentOrganizationId: input.organizationId,
    organizationOnboardingCompleted,
    shouldCreateWorkspace: false,
    shouldRunFirstSetup: isOwner && !organizationOnboardingCompleted,
    isOwner,
  };
}

async function fetchOrganizationOnboardingRow(
  supabase: OnboardingSupabaseClient,
  organizationId: string,
): Promise<OrganizationOnboardingRow | null> {
  const fullSelect = await supabase
    .from("organizations")
    .select("id, onboarding_completed, industry, settings")
    .eq("id", organizationId)
    .maybeSingle();

  if (!fullSelect.error && fullSelect.data) {
    return fullSelect.data as OrganizationOnboardingRow;
  }

  const fallbackSelect = await supabase
    .from("organizations")
    .select("id, settings")
    .eq("id", organizationId)
    .maybeSingle();

  if (fallbackSelect.error || !fallbackSelect.data) {
    return null;
  }

  return {
    id: fallbackSelect.data.id,
    onboarding_completed: null,
    industry: null,
    settings: fallbackSelect.data.settings,
  };
}

function buildOnboardingState(
  profile: ProfileRow,
  organization: OrganizationOnboardingRow | null,
): OnboardingState {
  return deriveOnboardingState({
    organizationId: profile.organization_id,
    role: profile.role,
    organization,
  });
}

async function loadOnboardingState(
  supabase: OnboardingSupabaseClient,
  userId: string,
): Promise<OnboardingState | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  if (!profile.organization_id) {
    return buildOnboardingState(profile, null);
  }

  const organization = await fetchOrganizationOnboardingRow(
    supabase,
    profile.organization_id,
  );

  return buildOnboardingState(profile, organization);
}

export async function getOnboardingStateForUser(
  supabase: OnboardingSupabaseClient,
  userId: string,
): Promise<OnboardingState | null> {
  return loadOnboardingState(supabase, userId);
}

export async function getOnboardingState(
  userId: string,
): Promise<OnboardingState | null> {
  return getOnboardingStateAdmin(userId);
}

export async function getOnboardingStateForCurrentUser(): Promise<OnboardingState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return getOnboardingStateAdmin(user.id);
}

export async function getOnboardingStateAdmin(
  userId: string,
): Promise<OnboardingState | null> {
  const admin = createAdminClient();
  return loadOnboardingState(admin, userId);
}

export function resolveOnboardingRedirect(
  pathname: string,
  state: OnboardingState,
): string | null {
  const normalized =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  const isOnboardingRoot = normalized === "/onboarding";
  const isOnboardingRoute = normalized.startsWith("/onboarding");
  const needsOnboarding =
    state.shouldCreateWorkspace || state.shouldRunFirstSetup;

  if (needsOnboarding) {
    if (isOnboardingRoot) {
      return null;
    }

    return "/onboarding";
  }

  if (isOnboardingRoute) {
    return "/today";
  }

  return null;
}

export function getPostAuthDestination(state: OnboardingState): string {
  if (state.shouldCreateWorkspace || state.shouldRunFirstSetup) {
    return "/onboarding";
  }

  return "/today";
}

export type { SolutionIndustry };

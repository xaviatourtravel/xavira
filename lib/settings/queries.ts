import { AI_MODEL } from "@/lib/ai/client";
import {
  loadAuditActivitySummary,
  loadAuditLogActors,
  loadAuditLogRoles,
  loadAuditLogs,
  type AuditActivitySummary,
  type AuditLogRow,
} from "@/lib/audit";
import {
  canManageIntegrations,
  canManageTeam,
  canManageWorkspaceSettings,
  hasPermission,
  isAdminOrOwner,
} from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadOrganizationIntegrations } from "@/lib/integrations/queries";
import {
  parseOrganizationWorkspaceSettings,
  type OrganizationWorkspaceSettings,
} from "@/lib/settings/organization-settings";
import type { SettingsSectionId } from "@/lib/settings/constants";
import { loadOrganizationInvites } from "@/lib/team/invites";
import { loadOrganizationTeamMembers } from "@/lib/team/queries";
import type { IntegrationCard } from "@/lib/integrations/queries";
import type { TeamMemberRow } from "@/lib/team/queries";
import type { OrganizationInviteRow } from "@/lib/team/invites";
import type { Tables } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

type Profile = Tables<"profiles">;
type Organization = Tables<"organizations">;

export type SettingsTeamMember = TeamMemberRow & {
  lastActiveAt: string;
};

export type AuditLogFilterParams = {
  module?: string;
  entityType?: string;
  actorUserId?: string;
  actorRole?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
};

export type SettingsWorkspaceData = {
  activeSection: SettingsSectionId;
  canManage: boolean;
  canManageTeam: boolean;
  canManageIntegrations: boolean;
  canManageAi: boolean;
  canViewAuditLogs: boolean;
  profile: Profile;
  organization: Organization;
  workspaceSettings: OrganizationWorkspaceSettings;
  teamMembers: SettingsTeamMember[];
  invites: OrganizationInviteRow[];
  integrations: IntegrationCard[];
  auditLogs: AuditLogRow[];
  auditActors: Array<{ id: string; name: string; role: string }>;
  auditRoles: string[];
  auditActivitySummary: AuditActivitySummary;
  auditFilters: {
    module: string;
    actorUserId: string;
    actorRole: string;
    action: string;
    fromDate: string;
    toDate: string;
  };
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function enrichIntegrations(
  integrations: IntegrationCard[],
  lastAiLog: { model: string; created_at: string } | null,
) {
  return integrations.map((integration) => {
    if (integration.provider === "openai") {
      const lastUsedAt = lastAiLog?.created_at
        ? formatDateTime(lastAiLog.created_at)
        : "No usage yet";

      return {
        ...integration,
        detailFields: integration.detailFields.map((field) => {
          if (field.key === "model") {
            return { ...field, value: lastAiLog?.model ?? AI_MODEL };
          }
          if (field.key === "lastUsedAt") {
            return { ...field, value: lastUsedAt };
          }
          if (field.key === "apiStatus") {
            return {
              ...field,
              value:
                integration.status === "connected" ? "Operational" : field.value,
            };
          }
          return field;
        }),
      };
    }

    if (integration.provider === "instagram_business") {
      return {
        ...integration,
        detailFields: integration.detailFields.map((field) => {
          if (field.key === "lastSyncedAt" && field.value !== "—") {
            return { ...field, value: formatDateTime(field.value) };
          }
          if (field.key === "followersCount" && field.value !== "—") {
            return {
              ...field,
              value: new Intl.NumberFormat("en-US").format(Number(field.value)),
            };
          }
          if (field.key === "connectionMethod" && field.value !== "—") {
            return {
              ...field,
              value: field.value === "oauth" ? "Meta OAuth" : "Manual token",
            };
          }
          return field;
        }),
      };
    }

    return integration;
  });
}

export async function loadSettingsWorkspaceData(
  activeSection: SettingsSectionId,
  auditFilterParams: AuditLogFilterParams = {},
): Promise<SettingsWorkspaceData> {
  const { profile } = await requireProfile();
  const canManage = canManageWorkspaceSettings(profile);
  const canManageTeamAccess = canManageTeam(profile);
  const canManageIntegrationsAccess = canManageIntegrations(profile);
  const canManageAi = hasPermission(profile, "ai_settings.manage");
  const canViewAuditLogs = isAdminOrOwner(profile);
  const supabase = await createClient();
  const auditFilters = {
    module: auditFilterParams.module ?? auditFilterParams.entityType ?? "",
    actorUserId: auditFilterParams.actorUserId ?? "",
    actorRole: auditFilterParams.actorRole ?? "",
    action: auditFilterParams.action ?? "",
    fromDate: auditFilterParams.fromDate ?? "",
    toDate: auditFilterParams.toDate ?? "",
  };

  const [
    { data: organization, error: organizationError },
    members,
    invites,
    integrations,
    { data: lastAiLog },
    { data: profilesWithActivity },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    loadOrganizationTeamMembers(supabase, profile.organization_id),
    canManageTeamAccess
      ? loadOrganizationInvites(supabase, profile.organization_id)
      : Promise.resolve([]),
    loadOrganizationIntegrations(supabase, profile.organization_id),
    supabase
      .from("ai_generation_logs")
      .select("model, created_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, updated_at")
      .eq("organization_id", profile.organization_id),
  ]);

  if (organizationError || !organization) {
    throw new Error(organizationError?.message ?? "Organization not found.");
  }

  const activityByUserId = new Map(
    (profilesWithActivity ?? []).map((row) => [row.id, row.updated_at]),
  );

  const teamMembers: SettingsTeamMember[] = members.map((member) => ({
    ...member,
    lastActiveAt: activityByUserId.get(member.id) ?? member.created_at,
  }));

  const [auditLogs, auditActors, auditRoles, auditActivitySummary] =
    canViewAuditLogs
      ? await Promise.all([
          loadAuditLogs(supabase, profile.organization_id, {
            module: auditFilters.module || undefined,
            actorUserId: auditFilters.actorUserId || undefined,
            actorRole: auditFilters.actorRole || undefined,
            action: auditFilters.action || undefined,
            fromDate: auditFilters.fromDate || undefined,
            toDate: auditFilters.toDate || undefined,
          }),
          loadAuditLogActors(supabase, profile.organization_id),
          loadAuditLogRoles(supabase, profile.organization_id),
          loadAuditActivitySummary(supabase, profile.organization_id),
        ])
      : [[], [], [], {
          repliesSent: 0,
          leadsConverted: 0,
          followUpsCreated: 0,
          bookingsCreated: 0,
          paymentsAdded: 0,
        }];

  return {
    activeSection,
    canManage,
    canManageTeam: canManageTeamAccess,
    canManageIntegrations: canManageIntegrationsAccess,
    canManageAi,
    canViewAuditLogs,
    profile,
    organization,
    workspaceSettings: parseOrganizationWorkspaceSettings(organization.settings),
    teamMembers,
    invites,
    integrations: enrichIntegrations(integrations, lastAiLog),
    auditLogs,
    auditActors,
    auditRoles,
    auditActivitySummary,
    auditFilters,
  };
}

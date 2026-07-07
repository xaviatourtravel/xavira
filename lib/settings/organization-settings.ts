import { siteConfig } from "@/config/site";

export type AiResponseMode = "manual_assist" | "suggested_reply" | "auto_reply";
export type AiTone = "professional" | "friendly" | "luxury";

export type OrganizationWorkspaceSettings = {
  businessEmail: string;
  website: string;
  currency: string;
  logoUrl: string | null;
  ai: {
    autoReplyEnabled: boolean;
    humanReplyCooldownEnabled: boolean;
    responseMode: AiResponseMode;
    tone: AiTone;
    knowledgeBaseEnabled: boolean;
  };
  inbox: {
    businessHoursStart: string;
    businessHoursEnd: string;
    autoAssignmentEnabled: boolean;
    defaultAssigneeId: string;
    roundRobinEnabled: boolean;
    outsideHoursAutoReply: string;
  };
  notifications: {
    newLead: boolean;
    newConversation: boolean;
    newBooking: boolean;
    overdueFollowUp: boolean;
  };
};

export const DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS: OrganizationWorkspaceSettings =
  {
    businessEmail: "",
    website: "",
    currency: siteConfig.defaultCurrency,
    logoUrl: null,
    ai: {
      autoReplyEnabled: false,
      humanReplyCooldownEnabled: true,
      responseMode: "manual_assist",
      tone: "professional",
      knowledgeBaseEnabled: true,
    },
    inbox: {
      businessHoursStart: "09:00",
      businessHoursEnd: "18:00",
      autoAssignmentEnabled: false,
      defaultAssigneeId: "",
      roundRobinEnabled: false,
      outsideHoursAutoReply:
        "Thanks for reaching out. Our team will respond during business hours.",
    },
    notifications: {
      newLead: true,
      newConversation: true,
      newBooking: true,
      overdueFollowUp: true,
    },
  };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function parseOrganizationWorkspaceSettings(
  value: unknown,
): OrganizationWorkspaceSettings {
  if (!isRecord(value)) {
    return DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS;
  }

  const ai = isRecord(value.ai) ? value.ai : {};
  const inbox = isRecord(value.inbox) ? value.inbox : {};
  const notifications = isRecord(value.notifications) ? value.notifications : {};

  return {
    businessEmail: readString(
      value.businessEmail,
      DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.businessEmail,
    ),
    website: readString(
      value.website,
      DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.website,
    ),
    currency: readString(
      value.currency,
      DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.currency,
    ),
    logoUrl:
      typeof value.logoUrl === "string"
        ? value.logoUrl
        : DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.logoUrl,
    ai: {
      autoReplyEnabled: readBoolean(
        ai.autoReplyEnabled,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.ai.autoReplyEnabled,
      ),
      humanReplyCooldownEnabled: readBoolean(
        ai.humanReplyCooldownEnabled,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.ai.humanReplyCooldownEnabled,
      ),
      responseMode:
        ai.responseMode === "suggested_reply" || ai.responseMode === "auto_reply"
          ? ai.responseMode
          : DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.ai.responseMode,
      tone:
        ai.tone === "friendly" || ai.tone === "luxury"
          ? ai.tone
          : DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.ai.tone,
      knowledgeBaseEnabled: readBoolean(
        ai.knowledgeBaseEnabled,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.ai.knowledgeBaseEnabled,
      ),
    },
    inbox: {
      businessHoursStart: readString(
        inbox.businessHoursStart,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.inbox.businessHoursStart,
      ),
      businessHoursEnd: readString(
        inbox.businessHoursEnd,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.inbox.businessHoursEnd,
      ),
      autoAssignmentEnabled: readBoolean(
        inbox.autoAssignmentEnabled,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.inbox.autoAssignmentEnabled,
      ),
      defaultAssigneeId: readString(
        inbox.defaultAssigneeId,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.inbox.defaultAssigneeId,
      ),
      roundRobinEnabled: readBoolean(
        inbox.roundRobinEnabled,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.inbox.roundRobinEnabled,
      ),
      outsideHoursAutoReply: readString(
        inbox.outsideHoursAutoReply,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.inbox.outsideHoursAutoReply,
      ),
    },
    notifications: {
      newLead: readBoolean(
        notifications.newLead,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.notifications.newLead,
      ),
      newConversation: readBoolean(
        notifications.newConversation,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.notifications.newConversation,
      ),
      newBooking: readBoolean(
        notifications.newBooking,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.notifications.newBooking,
      ),
      overdueFollowUp: readBoolean(
        notifications.overdueFollowUp,
        DEFAULT_ORGANIZATION_WORKSPACE_SETTINGS.notifications.overdueFollowUp,
      ),
    },
  };
}

export function mergeOrganizationWorkspaceSettings(
  current: unknown,
  patch: Partial<OrganizationWorkspaceSettings>,
) {
  const parsed = parseOrganizationWorkspaceSettings(current);

  return {
    ...parsed,
    ...patch,
    ai: {
      ...parsed.ai,
      ...patch.ai,
    },
    inbox: {
      ...parsed.inbox,
      ...patch.inbox,
    },
    notifications: {
      ...parsed.notifications,
      ...patch.notifications,
    },
  } satisfies OrganizationWorkspaceSettings;
}

export function isWorkspaceGlobalAutoReplyEnabled(settings: unknown) {
  return parseOrganizationWorkspaceSettings(settings).ai.autoReplyEnabled;
}

/** @deprecated Use isWorkspaceGlobalAutoReplyEnabled */
export function isWorkspaceAiChatEnabled(settings: unknown) {
  return isWorkspaceGlobalAutoReplyEnabled(settings);
}

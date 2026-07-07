import { parseFirstRunSettings } from "@/lib/onboarding/settings";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

export type AiWorkspaceProfile = {
  id: string;
  name: string;
  timezone: string;
  companyName: string | null;
  businessName: string | null;
  displayName: string | null;
  workspaceName: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSettingString(
  record: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!record) {
    return null;
  }

  const value = record[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseWorkspaceProfileFromSettings(
  settings: unknown,
  organizationName: string,
): Omit<AiWorkspaceProfile, "id" | "name" | "timezone"> {
  const root = isRecord(settings) ? settings : {};
  const workspace = isRecord(root.workspace) ? root.workspace : {};
  const firstRun = parseFirstRunSettings(root.firstRun);

  const companyName =
    readSettingString(root, "company_name") ??
    readSettingString(workspace, "company_name") ??
    (organizationName.trim() || null);

  const businessName =
    readSettingString(root, "business_name") ??
    readSettingString(workspace, "business_name");

  const displayName =
    readSettingString(root, "display_name") ??
    readSettingString(workspace, "display_name");

  const workspaceNameFromSettings =
    firstRun?.workspaceName ?? readSettingString(workspace, "name");
  const workspaceName = workspaceNameFromSettings?.trim()
    ? workspaceNameFromSettings.trim()
    : organizationName.trim() || null;

  return {
    companyName,
    businessName,
    displayName,
    workspaceName,
  };
}

/**
 * Customer-facing workspace/company label for AI replies.
 * Fallback: company_name → business_name → workspace.name → "tim kami"
 */
export function getWorkspaceDisplayName(
  workspace: Pick<
    AiWorkspaceProfile,
    "companyName" | "businessName" | "workspaceName" | "name"
  >,
): string {
  for (const value of [
    workspace.companyName,
    workspace.businessName,
    workspace.workspaceName ?? workspace.name,
  ]) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return "tim kami";
}

export async function loadAiWorkspaceProfile(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
): Promise<AiWorkspaceProfile | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, timezone, settings")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsed = parseWorkspaceProfileFromSettings(data.settings, data.name);

  return {
    id: data.id,
    name: data.name,
    ...parsed,
    timezone: data.timezone?.trim() || "Asia/Jakarta",
  };
}

const DESKLABS_PATTERN = /\bdesklabs\b/i;

export function customerAskedAboutDesklabsPlatform(messageText: string): boolean {
  return DESKLABS_PATTERN.test(messageText);
}

/**
 * Strip or replace platform branding from outbound AI copy unless the
 * customer explicitly asked about Desklabs.
 */
export function sanitizeAiReplyBranding(
  reply: string,
  customerMessage: string,
  companyName: string,
): string {
  if (!DESKLABS_PATTERN.test(reply)) {
    return reply;
  }

  if (customerAskedAboutDesklabsPlatform(customerMessage)) {
    return reply;
  }

  const replacement =
    companyName.trim() && companyName !== "tim kami" ? companyName : "tim kami";

  return reply.replace(DESKLABS_PATTERN, replacement);
}

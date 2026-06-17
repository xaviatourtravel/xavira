import { randomBytes } from "crypto";

import { formatTeamRoleLabel } from "@/lib/team/constants";
import type { TablesInsert } from "@/types/database";
import type { UserRole } from "@/types/app-types";
import type { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const INVITE_ROLES = ["admin", "agent"] as const;

export type InviteRole = (typeof INVITE_ROLES)[number];

export const INVITE_EXPIRY_DAYS = 7;

export type OrganizationInviteRow = {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type OrganizationInvitePreview = {
  token: string;
  email: string;
  role: UserRole;
  organizationName: string;
  expiresAt: string;
};

type ProfileInsert = TablesInsert<"profiles">;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export function isInviteRole(value: string): value is InviteRole {
  return INVITE_ROLES.includes(value as InviteRole);
}

export function parseInviteRole(value: string): InviteRole | null {
  const trimmed = value.trim();
  return isInviteRole(trimmed) ? trimmed : null;
}

export function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

export function getInviteExpiryDate(days = INVITE_EXPIRY_DAYS) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isInviteExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function isInvitePending(invite: Pick<OrganizationInviteRow, "status">) {
  return invite.status === "pending";
}

export function buildInviteRegisterPath(token: string) {
  return `/register?invite=${encodeURIComponent(token)}`;
}

export function buildInviteRegisterUrl(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${baseUrl}${buildInviteRegisterPath(token)}`;
}

export function getInviteValidationError(
  invite: OrganizationInviteRow | null,
  email?: string,
) {
  if (!invite) {
    return "Undangan tidak ditemukan.";
  }

  if (!isInvitePending(invite)) {
    return "Undangan sudah tidak aktif.";
  }

  if (isInviteExpired(invite.expires_at)) {
    return "Undangan sudah kedaluwarsa.";
  }

  if (email && normalizeInviteEmail(email) !== normalizeInviteEmail(invite.email)) {
    return "Email pendaftaran harus sama dengan email undangan.";
  }

  return null;
}

export async function getOrganizationInviteByToken(token: string) {
  const trimmed = token.trim();

  if (!trimmed) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_invites")
    .select(
      "id, organization_id, email, role, token, status, expires_at, accepted_at, created_by, created_at",
    )
    .eq("token", trimmed)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OrganizationInviteRow;
}

export async function getOrganizationInvitePreview(
  token: string,
): Promise<OrganizationInvitePreview | null> {
  const invite = await getOrganizationInviteByToken(token);

  if (!invite || getInviteValidationError(invite)) {
    return null;
  }

  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("name")
    .eq("id", invite.organization_id)
    .maybeSingle();

  if (!organization?.name) {
    return null;
  }

  return {
    token: invite.token,
    email: invite.email,
    role: invite.role,
    organizationName: organization.name,
    expiresAt: invite.expires_at,
  };
}

export async function loadOrganizationInvites(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("organization_invites")
    .select(
      "id, organization_id, email, role, token, status, expires_at, accepted_at, created_by, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load organization invites error:", error);
    throw new Error(error.message);
  }

  return (data ?? []) as OrganizationInviteRow[];
}

export function formatInviteStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    default:
      return status;
  }
}

export function formatInviteRoleLabel(role: UserRole) {
  return formatTeamRoleLabel(role);
}

export async function acceptOrganizationInvite(input: {
  userId: string;
  fullName: string;
  email: string;
  inviteToken: string;
}): Promise<string | null> {
  const admin = createAdminClient();
  const invite = await getOrganizationInviteByToken(input.inviteToken);
  const validationError = getInviteValidationError(invite, input.email);

  if (validationError || !invite) {
    return validationError ?? "Undangan tidak valid.";
  }

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .select("id")
    .eq("id", invite.organization_id)
    .maybeSingle();

  if (organizationError) {
    return organizationError.message;
  }

  if (!organization) {
    return "Organisasi undangan tidak ditemukan.";
  }

  const profilePayload: ProfileInsert = {
    id: input.userId,
    organization_id: invite.organization_id,
    full_name: input.fullName,
    role: invite.role,
  };

  const { error: profileError } = await admin.from("profiles").insert(profilePayload);

  if (profileError) {
    if (profileError.code === "23505") {
      return null;
    }

    return profileError.message;
  }

  const { error: inviteUpdateError } = await admin
    .from("organization_invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .eq("status", "pending");

  if (inviteUpdateError) {
    return inviteUpdateError.message;
  }

  return null;
}

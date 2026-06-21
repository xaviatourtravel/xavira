"use server";

import { revalidatePath } from "next/cache";

import { parseTeamRole } from "@/lib/team/constants";
import {
  buildInviteRegisterUrl,
  generateInviteToken,
  getInviteExpiryDate,
  normalizeInviteEmail,
  parseInviteRole,
} from "@/lib/team/invites";
import { getTeamRoleChangeErrorMessage } from "@/lib/team/permissions";
import { countOrganizationOwners } from "@/lib/team/queries";
import { canManageTeam } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { auditFromProfile } from "@/lib/audit";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateTeamMemberRole(formData: FormData) {
  const { profile } = await requireProfile();

  if (!canManageTeam(profile)) {
    return {
      success: false,
      message: "You do not have permission to manage the team.",
    };
  }

  const memberId = getString(formData, "member_id");
  const newRole = parseTeamRole(getString(formData, "role"));

  if (!memberId) {
    return {
      success: false,
      message: "Anggota tim tidak ditemukan.",
    };
  }

  if (!newRole) {
    return {
      success: false,
      message: "Role tidak valid.",
    };
  }

  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id, role, organization_id, full_name")
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (memberError) {
    return {
      success: false,
      message: "Gagal memuat data anggota tim.",
    };
  }

  if (!member) {
    return {
      success: false,
      message: "Anggota tim tidak ditemukan di organisasi Anda.",
    };
  }

  const ownerCount = await countOrganizationOwners(
    supabase,
    profile.organization_id,
  );
  const validationMessage = getTeamRoleChangeErrorMessage(
    member.role,
    newRole,
    ownerCount,
  );

  if (validationMessage) {
    return {
      success: false,
      message: validationMessage,
    };
  }

  const { data: updatedMember, error: updateError } = await supabase
    .from("profiles")
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return {
      success: false,
      message: "Gagal memperbarui role anggota tim.",
    };
  }

  if (!updatedMember) {
    return {
      success: false,
      message: "Anggota tim tidak ditemukan di organisasi Anda.",
    };
  }

  await auditFromProfile(supabase, profile, {
    action: "role_updated",
    entityType: "team",
    entityId: memberId,
    entityLabel: member.full_name?.trim() || memberId,
    metadata: {
      from: member.role,
      to: newRole,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/team");

  return {
    success: true,
    message: "Role anggota tim berhasil diperbarui.",
  };
}

export async function createOrganizationInvite(formData: FormData) {
  const { profile } = await requireProfile();

  if (!canManageTeam(profile)) {
    return {
      success: false,
      message: "You do not have permission to manage the team.",
    };
  }

  const email = normalizeInviteEmail(getString(formData, "email"));
  const role = parseInviteRole(getString(formData, "role"));

  if (!email) {
    return {
      success: false,
      message: "Email wajib diisi.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      message: "Format email tidak valid.",
    };
  }

  if (!role) {
    return {
      success: false,
      message: "Role undangan tidak valid.",
    };
  }

  const supabase = await createClient();
  const token = generateInviteToken();

  const { data: invite, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: profile.organization_id,
      email,
      role,
      token,
      status: "pending",
      expires_at: getInviteExpiryDate(),
      created_by: profile.id,
    })
    .select("token")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "Undangan pending untuk email ini sudah ada.",
      };
    }

    return {
      success: false,
      message: "Gagal membuat undangan tim.",
    };
  }

  if (!invite) {
    return {
      success: false,
      message: "Gagal membuat undangan tim.",
    };
  }

  await auditFromProfile(supabase, profile, {
    action: "team_member_invited",
    entityType: "team",
    entityId: email,
    entityLabel: email,
    metadata: {
      role,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/team");

  return {
    success: true,
    message: "Undangan tim berhasil dibuat.",
    inviteUrl: buildInviteRegisterUrl(invite.token),
  };
}

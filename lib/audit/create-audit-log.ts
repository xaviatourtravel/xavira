import type { createClient } from "@/utils/supabase/server";
import type { Profile } from "@/types/app-types";

import { sanitizeAuditMetadata } from "./sanitize";
import type { CreateAuditLogInput } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export function buildAuditActor(profile: Profile) {
  return {
    actorUserId: profile.id,
    actorName: profile.full_name?.trim() || profile.id || "Unknown user",
    actorRole: profile.role,
  };
}

export async function createAuditLog(
  supabase: SupabaseServerClient,
  input: CreateAuditLogInput,
) {
  try {
    const metadata = sanitizeAuditMetadata(input.metadata ?? {});

    const { error } = await supabase.from("audit_logs").insert({
      organization_id: input.organizationId,
      actor_user_id: input.actorUserId,
      actor_name: input.actorName,
      actor_role: input.actorRole,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? null,
      metadata_json: metadata,
    });

    if (error) {
      return;
    }
  } catch {
    // Audit logging must never block primary user actions.
  }
}

export async function auditFromProfile(
  supabase: SupabaseServerClient,
  profile: Profile,
  input: Omit<
    CreateAuditLogInput,
    "organizationId" | "actorUserId" | "actorName" | "actorRole"
  >,
) {
  const actor = buildAuditActor(profile);

  await createAuditLog(supabase, {
    organizationId: profile.organization_id,
    ...actor,
    ...input,
  });
}

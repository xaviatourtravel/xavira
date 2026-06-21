import type { createClient } from "@/utils/supabase/server";

import type { AuditLogFilters, AuditLogRow } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadAuditLogs(
  supabase: SupabaseServerClient,
  organizationId: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogRow[]> {
  const limit = filters.limit ?? 100;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, organization_id, actor_user_id, actor_name, actor_role, action, entity_type, entity_id, entity_label, metadata_json, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters.actorUserId) {
    query = query.eq("actor_user_id", filters.actorUserId);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.fromDate) {
    query = query.gte("created_at", `${filters.fromDate}T00:00:00.000Z`);
  }

  if (filters.toDate) {
    query = query.lte("created_at", `${filters.toDate}T23:59:59.999Z`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditLogRow[];
}

export async function loadAuditLogActors(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", organizationId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name?.trim() || profile.id,
  }));
}

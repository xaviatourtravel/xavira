import type { createClient } from "@/utils/supabase/server";

import {
  getModuleFilterActions,
  getModuleFilterEntityTypes,
  isAuditModule,
} from "./modules";
import type {
  AuditActivitySummary,
  AuditLogFilters,
  AuditLogRow,
} from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function getJakartaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getJakartaDayBounds(date = new Date()) {
  const dateString = getJakartaDateString(date);

  return {
    from: `${dateString}T00:00:00.000+07:00`,
    to: `${dateString}T23:59:59.999+07:00`,
  };
}

export async function loadAuditLogs(
  supabase: SupabaseServerClient,
  organizationId: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogRow[]> {
  const limit = filters.limit ?? 200;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, organization_id, actor_user_id, actor_name, actor_role, action, entity_type, entity_id, entity_label, metadata_json, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.module && isAuditModule(filters.module)) {
    const actions = getModuleFilterActions(filters.module);
    const entityTypes = getModuleFilterEntityTypes(filters.module);

    if (actions) {
      query = query.in("action", actions);
    }

    if (entityTypes) {
      query = query.in("entity_type", entityTypes);
    }

    if (filters.module === "leads") {
      query = query.neq("action", "follow_up_created");
    }
  } else if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters.actorUserId) {
    query = query.eq("actor_user_id", filters.actorUserId);
  }

  if (filters.actorRole) {
    query = query.eq("actor_role", filters.actorRole);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.fromDate) {
    query = query.gte("created_at", `${filters.fromDate}T00:00:00.000+07:00`);
  }

  if (filters.toDate) {
    query = query.lte("created_at", `${filters.toDate}T23:59:59.999+07:00`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditLogRow[];
}

export async function loadAuditActivitySummary(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<AuditActivitySummary> {
  const { from, to } = getJakartaDayBounds();
  const trackedActions = [
    "reply_sent",
    "conversation_converted_to_lead",
    "follow_up_created",
    "booking_created",
    "payment_added",
  ] as const;

  const { data, error } = await supabase
    .from("audit_logs")
    .select("action")
    .eq("organization_id", organizationId)
    .gte("created_at", from)
    .lte("created_at", to)
    .in("action", [...trackedActions]);

  if (error) {
    throw new Error(error.message);
  }

  const counts = Object.fromEntries(
    trackedActions.map((action) => [action, 0]),
  ) as Record<(typeof trackedActions)[number], number>;

  for (const row of data ?? []) {
    if (row.action in counts) {
      counts[row.action as (typeof trackedActions)[number]] += 1;
    }
  }

  return {
    repliesSent: counts.reply_sent,
    leadsConverted: counts.conversation_converted_to_lead,
    followUpsCreated: counts.follow_up_created,
    bookingsCreated: counts.booking_created,
    paymentsAdded: counts.payment_added,
  };
}

export async function loadAuditLogActors(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("organization_id", organizationId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name?.trim() || profile.id,
    role: profile.role,
  }));
}

export async function loadAuditLogRoles(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((profile) => profile.role))].sort();
}

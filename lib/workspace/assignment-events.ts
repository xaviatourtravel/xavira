import type { AssignmentHistoryEntry } from "@/types/omnichannel-inbox";
import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type AssignmentEventRow = {
  id: string;
  organization_id: string;
  conversation_channel: string;
  conversation_id: string;
  assigned_from: string | null;
  assigned_to: string | null;
  assigned_by: string;
  created_at: string;
};

export async function insertWorkspaceAssignmentEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    conversationChannel: string;
    conversationId: string;
    assignedFrom: string | null;
    assignedTo: string | null;
    assignedBy: string;
  },
) {
  const { error } = await supabase.from("workspace_assignment_events").insert({
    organization_id: input.organizationId,
    conversation_channel: input.conversationChannel,
    conversation_id: input.conversationId,
    assigned_from: input.assignedFrom,
    assigned_to: input.assignedTo,
    assigned_by: input.assignedBy,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadWorkspaceAssignmentHistory(
  supabase: SupabaseClient,
  organizationId: string,
  conversationId: string,
): Promise<AssignmentHistoryEntry[]> {
  const { data, error } = await supabase
    .from("workspace_assignment_events")
    .select(
      "id, assigned_from, assigned_to, assigned_by, created_at",
    )
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as AssignmentEventRow[];

  if (rows.length === 0) {
    return [];
  }

  const profileIds = [
    ...new Set(
      rows.flatMap((row) =>
        [row.assigned_from, row.assigned_to, row.assigned_by].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  ];

  const nameById = new Map<string, string>();

  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .in("id", profileIds);

    for (const profile of profiles ?? []) {
      nameById.set(profile.id, profile.full_name?.trim() || "Team member");
    }
  }

  return rows.map((row) => ({
    id: row.id,
    assignedFromId: row.assigned_from,
    assignedFromName: row.assigned_from
      ? (nameById.get(row.assigned_from) ?? "Team member")
      : null,
    assignedToId: row.assigned_to,
    assignedToName: row.assigned_to
      ? (nameById.get(row.assigned_to) ?? "Team member")
      : null,
    assignedByName: nameById.get(row.assigned_by) ?? "Team member",
    createdAt: row.created_at,
  }));
}

import { requireProfile } from "@/lib/auth/session";
import { AiActionsQueuePageClient } from "@/modules/inbox/components/ai-actions-queue-page";
import {
  loadWorkspaceAiActions,
  parseWorkspaceAiActionFilters,
} from "@/modules/inbox/lib/load-workspace-ai-actions";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "AI Actions · Desklabs",
};

export default async function AiActionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    actionType?: string;
    confidenceMin?: string;
    createdFrom?: string;
    createdTo?: string;
  }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();

  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }

  const filters = parseWorkspaceAiActionFilters(params);
  const supabase = await createClient();

  const [actions, organizationResult, pendingCountResult, scheduledCountResult] =
    await Promise.all([
    loadWorkspaceAiActions(supabase, profile.organization_id, filters),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("ai_actions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", profile.organization_id)
      .eq("status", "PENDING"),
    supabase
      .from("ai_actions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", profile.organization_id)
      .eq("status", "SCHEDULED"),
  ]);

  const workspaceName = organizationResult.data?.name?.trim() || null;
  const pendingCount = pendingCountResult.count ?? 0;
  const scheduledCount = scheduledCountResult.count ?? 0;

  return (
    <AiActionsQueuePageClient
      actions={actions}
      organizationId={profile.organization_id}
      workspaceName={workspaceName}
      pendingCount={pendingCount}
      scheduledCount={scheduledCount}
      activeTab={filters.tab ?? "pending"}
      filters={{
        actionType: params.actionType?.trim() || "all",
        confidenceMin: params.confidenceMin?.trim() || "",
        createdFrom: params.createdFrom?.trim() || "",
        createdTo: params.createdTo?.trim() || "",
      }}
    />
  );
}

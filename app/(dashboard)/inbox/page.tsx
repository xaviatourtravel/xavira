import { InboxFilters, InboxConversationsTable, parseInboxPageFilters } from "@/components/inbox/inbox-conversations-table";
import { NewConversationPanel } from "@/components/inbox/new-conversation-panel";
import { InboxOverviewCard } from "@/components/inbox/inbox-overview-card";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { getOrgCampaignOptions } from "@/lib/campaigns/queries";
import { loadInboxDashboardMetrics } from "@/lib/inbox/metrics";
import { loadInboxConversations } from "@/lib/inbox/queries";
import { createClient } from "@/utils/supabase/server";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    source?: string;
    assigned?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canManage = isAdminOrOwner(profile);
  const filters = parseInboxPageFilters(params);
  const supabase = await createClient();

  const [{ data: orgProfiles }, campaigns, conversations, metrics] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", profile.organization_id)
        .order("full_name"),
      getOrgCampaignOptions(supabase, profile.organization_id),
      loadInboxConversations(supabase, profile.organization_id, filters),
      loadInboxDashboardMetrics(supabase, profile.organization_id),
    ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Lead capture dari Instagram dan Facebook DM sebelum follow up sales.
        </p>
      </div>

      {params.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {params.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(params.success)}
        </div>
      )}

      <InboxOverviewCard metrics={metrics} />

      {canManage && <NewConversationPanel campaigns={campaigns} />}

      <InboxFilters
        currentStatus={filters.raw.status}
        currentSource={filters.raw.source}
        currentAssigned={filters.raw.assigned}
        showAssignedFilter={canManage}
        orgProfiles={orgProfiles ?? []}
      />

      <InboxConversationsTable conversations={conversations} />
    </div>
  );
}

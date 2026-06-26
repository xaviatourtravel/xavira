import { Suspense } from "react";
import { notFound } from "next/navigation";

import { CustomerWorkspaceView } from "@/components/customers/customer-workspace-view";
import {
  hasMinimalCustomerAiContext,
  loadCustomerAiSummaryContext,
  readCustomerAiSummaryCache,
} from "@/lib/ai/customer-summary";
import { requireProfile } from "@/lib/auth/session";
import { parseCustomerWorkspaceTab } from "@/lib/customers/constants";
import { loadCustomerWorkspace } from "@/lib/customers/load-customer-workspace";
import {
  canReplyToOmnichannelConversation,
  canSuggestOmnichannelReply,
} from "@/lib/omnichannel-inbox/permissions";
import { createClient } from "@/utils/supabase/server";

export default async function CustomerWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; error?: string; success?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const activeTab = parseCustomerWorkspaceTab(query.tab);
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [data, aiContext] = await Promise.all([
    loadCustomerWorkspace(supabase, profile.organization_id, id),
    loadCustomerAiSummaryContext(supabase, profile.organization_id, id),
  ]);

  if (!data) {
    notFound();
  }

  const { data: leadMetadataRow } = await supabase
    .from("leads")
    .select("metadata")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  const metadata =
    leadMetadataRow?.metadata && typeof leadMetadataRow.metadata === "object"
      ? (leadMetadataRow.metadata as Record<string, unknown>)
      : {};

  const initialAiSummary = aiContext
    ? readCustomerAiSummaryCache(metadata, aiContext.fingerprint)
    : null;
  const hasMinimalAiContext = aiContext
    ? hasMinimalCustomerAiContext(aiContext)
    : false;

  const permissionsConversation = {
    assigned_user_id: data.conversationDetail?.assignedUserId ?? null,
  };

  const canReplyToConversation = data.conversationDetail
    ? canReplyToOmnichannelConversation(profile, permissionsConversation)
    : false;
  const canSuggestReply = data.conversationDetail
    ? canSuggestOmnichannelReply(profile, permissionsConversation)
    : false;
  const isUnassignedForAgent =
    permissionsConversation.assigned_user_id === null &&
    !canReplyToConversation;

  return (
    <div className="space-y-6">
      {query.error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      ) : null}

      {query.success ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(query.success)}
        </div>
      ) : null}

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading workspace...</div>}>
        <CustomerWorkspaceView
          data={data}
          activeTab={activeTab}
          canReplyToConversation={canReplyToConversation}
          canSuggestReply={canSuggestReply}
          isUnassignedForAgent={isUnassignedForAgent}
          hasBooking={data.bookings.length > 0}
          initialAiSummary={initialAiSummary}
          hasMinimalAiContext={hasMinimalAiContext}
        />
      </Suspense>
    </div>
  );
}

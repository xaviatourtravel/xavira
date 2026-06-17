import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ConvertToLeadPanel,
  InboxConversationActions,
  InboxLeadLink,
} from "@/components/inbox/inbox-conversation-actions";
import { InboxChatAssistantPanel } from "@/components/inbox/inbox-chat-assistant-panel";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { getOrgCampaignOptions } from "@/lib/campaigns/queries";
import { formatInboxSourceLabel, formatInboxStatusLabel } from "@/lib/inbox/constants";
import { loadInboxConversationById } from "@/lib/inbox/queries";
import { formatAssignedUserLabel } from "@/lib/leads/assignment";
import { createClient } from "@/utils/supabase/server";

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function InboxConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireProfile();
  const canManage = isAdminOrOwner(profile);
  const supabase = await createClient();

  const [conversation, { data: orgProfiles }, campaigns] = await Promise.all([
    loadInboxConversationById(supabase, profile.organization_id, id),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
    getOrgCampaignOptions(supabase, profile.organization_id),
  ]);

  if (!conversation) {
    notFound();
  }

  const linkedLeadPackage = conversation.leadId
    ? await supabase
        .from("leads")
        .select("package_interest")
        .eq("id", conversation.leadId)
        .eq("organization_id", profile.organization_id)
        .is("deleted_at", null)
        .maybeSingle()
    : { data: null };

  const packageName = linkedLeadPackage.data?.package_interest ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/inbox" className="text-sm text-muted-foreground hover:underline">
            ← Kembali ke Inbox
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{conversation.contactName}</h1>
          <p className="text-sm text-muted-foreground">
            {formatInboxSourceLabel(conversation.source)} conversation
          </p>
        </div>
      </div>

      {query.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {query.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(query.success)}
        </div>
      )}

      <div className="grid gap-4 rounded-xl border p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Status</p>
          <p className="mt-1 font-medium">{formatInboxStatusLabel(conversation.status)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Assigned</p>
          <p className="mt-1 font-medium">
            {formatAssignedUserLabel(conversation.assignedToName)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Campaign</p>
          <p className="mt-1 font-medium">{conversation.campaignName ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Last Message At</p>
          <p className="mt-1 font-medium">
            {formatDateTime(conversation.lastMessageAt ?? conversation.updatedAt)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Last Message</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
          {conversation.lastMessage || "Belum ada ringkasan pesan."}
        </p>
        {conversation.contactHandle && (
          <p className="mt-3 text-sm">
            <span className="font-medium">Handle:</span> {conversation.contactHandle}
          </p>
        )}
      </div>

      {canManage && (
        <InboxChatAssistantPanel
          conversationId={conversation.id}
          defaultIncomingMessage={conversation.lastMessage ?? ""}
          hasLinkedLead={Boolean(conversation.leadId)}
          packageName={packageName}
        />
      )}

      {conversation.leadId ? (
        <InboxLeadLink
          leadId={conversation.leadId}
          leadName={conversation.leadName}
        />
      ) : (
        <ConvertToLeadPanel
          conversationId={conversation.id}
          defaultFullName={conversation.contactName}
          defaultCampaignId={conversation.campaignId}
          defaultAssignedTo={conversation.assignedTo}
          orgProfiles={orgProfiles ?? []}
          campaigns={campaigns}
          canManage={canManage}
        />
      )}

      <InboxConversationActions
        conversationId={conversation.id}
        currentStatus={conversation.status}
        currentAssignedTo={conversation.assignedTo}
        orgProfiles={orgProfiles ?? []}
        canManage={canManage}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  assignInboxConversation,
  convertInboxConversationToLead,
  updateInboxConversationStatus,
} from "@/app/(dashboard)/inbox/actions";
import { CampaignSelect } from "@/components/campaigns/campaign-select";
import { Button } from "@/components/ui/button";
import {
  INBOX_STATUSES,
  formatInboxStatusLabel,
  type InboxStatus,
} from "@/lib/inbox/constants";
import type { OrgProfileOption } from "@/lib/leads/assignment";

type InboxConversationActionsProps = {
  conversationId: string;
  currentStatus: InboxStatus;
  currentAssignedTo: string | null;
  orgProfiles: OrgProfileOption[];
  canManage: boolean;
};

export function InboxConversationActions({
  conversationId,
  currentStatus,
  currentAssignedTo,
  orgProfiles,
  canManage,
}: InboxConversationActionsProps) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [isStatusPending, startStatusTransition] = useTransition();
  const [isAssignPending, startAssignTransition] = useTransition();

  if (!canManage) {
    return null;
  }

  function handleStatusSubmit(formData: FormData) {
    setStatusMessage(null);

    startStatusTransition(async () => {
      const result = await updateInboxConversationStatus(formData);

      if (!result.success) {
        setStatusMessage(result.message);
        return;
      }

      setStatusMessage(result.message);
      router.refresh();
    });
  }

  function handleAssignSubmit(formData: FormData) {
    setAssignMessage(null);

    startAssignTransition(async () => {
      const result = await assignInboxConversation(formData);

      if (!result.success) {
        setAssignMessage(result.message);
        return;
      }

      setAssignMessage(result.message);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Conversation Status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lacak progres dari DM baru hingga lead dikonversi.
        </p>

        <form action={handleStatusSubmit} className="mt-4 space-y-3">
          <input type="hidden" name="conversation_id" value={conversationId} />
          <select
            name="status"
            defaultValue={currentStatus}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {INBOX_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatInboxStatusLabel(status)}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={isStatusPending}>
            {isStatusPending ? "Menyimpan..." : "Update Status"}
          </Button>
          {statusMessage && (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          )}
        </form>
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Assignment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign percakapan ke sales sebelum atau sesudah konversi lead.
        </p>

        <form action={handleAssignSubmit} className="mt-4 space-y-3">
          <input type="hidden" name="conversation_id" value={conversationId} />
          <select
            name="assigned_to"
            defaultValue={currentAssignedTo ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Belum di-assign</option>
            {orgProfiles.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={isAssignPending}>
            {isAssignPending ? "Menyimpan..." : "Assign Sales"}
          </Button>
          {assignMessage && (
            <p className="text-sm text-muted-foreground">{assignMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}

type ConvertToLeadPanelProps = {
  conversationId: string;
  defaultFullName: string;
  defaultCampaignId: string | null;
  defaultAssignedTo: string | null;
  orgProfiles: OrgProfileOption[];
  campaigns: ReadonlyArray<{ id: string; name: string }>;
  canManage: boolean;
};

export function ConvertToLeadPanel({
  conversationId,
  defaultFullName,
  defaultCampaignId,
  defaultAssignedTo,
  orgProfiles,
  campaigns,
  canManage,
}: ConvertToLeadPanelProps) {
  if (!canManage) {
    return null;
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Convert to Lead</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Buat lead CRM dari percakapan ini. Nama, source, dan campaign sudah
        di-prefill.
      </p>

      <form action={convertInboxConversationToLead} className="mt-4 space-y-4">
        <input type="hidden" name="conversation_id" value={conversationId} />

        <div>
          <label htmlFor="full_name" className="text-sm font-medium">
            Nama Lead
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={defaultFullName}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="whatsapp_number" className="text-sm font-medium">
            WhatsApp Number
          </label>
          <input
            id="whatsapp_number"
            name="whatsapp_number"
            placeholder="62812xxxxxxx"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Isi nomor WhatsApp yang diperoleh admin dari DM.
          </p>
        </div>

        <div>
          <label htmlFor="assigned_to" className="text-sm font-medium">
            Assign Sales
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            defaultValue={defaultAssignedTo ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Belum di-assign</option>
            {orgProfiles.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="campaign_id" className="text-sm font-medium">
            Campaign
          </label>
          <CampaignSelect
            campaigns={campaigns}
            defaultValue={defaultCampaignId}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="notes" className="text-sm font-medium">
            Catatan
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Ringkasan percakapan atau konteks follow up"
          />
        </div>

        <Button type="submit">Convert to Lead</Button>
      </form>
    </div>
  );
}

type InboxLeadLinkProps = {
  leadId: string;
  leadName: string | null;
};

export function InboxLeadLink({ leadId, leadName }: InboxLeadLinkProps) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6">
      <h2 className="text-lg font-semibold text-green-900">Lead Created</h2>
      <p className="mt-1 text-sm text-green-800">
        Percakapan ini sudah dikonversi menjadi lead CRM.
      </p>
      <Link
        href={`/leads/${leadId}`}
        className="mt-4 inline-flex text-sm font-medium text-green-900 underline"
      >
        Buka lead: {leadName ?? leadId}
      </Link>
    </div>
  );
}

import Link from "next/link";

import {
  INBOX_SOURCES,
  INBOX_STATUSES,
  formatInboxSourceLabel,
  formatInboxStatusLabel,
  isInboxSource,
  isInboxStatus,
} from "@/lib/inbox/constants";
import type { InboxConversationListItem } from "@/lib/inbox/queries";
import { formatAssignedUserLabel } from "@/lib/leads/assignment";

type InboxFiltersProps = {
  currentStatus?: string;
  currentSource?: string;
  currentAssigned?: string;
  showAssignedFilter?: boolean;
  orgProfiles?: ReadonlyArray<{ id: string; full_name: string }>;
};

export function InboxFilters({
  currentStatus = "",
  currentSource = "",
  currentAssigned = "",
  showAssignedFilter = false,
  orgProfiles = [],
}: InboxFiltersProps) {
  return (
    <form method="get" action="/inbox" className="flex flex-wrap gap-3 rounded-xl border p-4">
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Semua Status</option>
        {INBOX_STATUSES.map((status) => (
          <option key={status} value={status}>
            {formatInboxStatusLabel(status)}
          </option>
        ))}
      </select>

      <select
        name="source"
        defaultValue={currentSource}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Semua Source</option>
        {INBOX_SOURCES.map((source) => (
          <option key={source} value={source}>
            {formatInboxSourceLabel(source)}
          </option>
        ))}
      </select>

      {showAssignedFilter && (
        <select
          name="assigned"
          defaultValue={currentAssigned}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua Assignment</option>
          <option value="unassigned">Belum di-assign</option>
          <option value="me">Assigned to Me</option>
          {orgProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        className="rounded-md border bg-background px-4 py-2 text-sm font-medium"
      >
        Filter
      </button>
    </form>
  );
}

type InboxConversationsTableProps = {
  conversations: InboxConversationListItem[];
};

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

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "qualified":
      return "bg-amber-100 text-amber-800";
    case "converted":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function InboxConversationsTable({
  conversations,
}: InboxConversationsTableProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Belum ada percakapan inbox. Tambahkan DM Instagram atau Facebook untuk
        mulai lead capture.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Last Message</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assigned</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conversation) => (
            <tr key={conversation.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">{conversation.sourceLabel}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{conversation.contactName}</div>
                {conversation.contactHandle && (
                  <div className="text-xs text-muted-foreground">
                    {conversation.contactHandle}
                  </div>
                )}
              </td>
              <td className="max-w-xs px-4 py-3">
                <p className="line-clamp-2 text-muted-foreground">
                  {conversation.lastMessage || "-"}
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(conversation.status)}`}
                >
                  {conversation.statusLabel}
                </span>
              </td>
              <td className="px-4 py-3">
                {formatAssignedUserLabel(conversation.assignedToName)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatDateTime(conversation.lastMessageAt ?? conversation.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/inbox/${conversation.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  Buka
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function parseInboxPageFilters(searchParams: {
  status?: string;
  source?: string;
  assigned?: string;
}) {
  const status = searchParams.status?.trim() ?? "";
  const source = searchParams.source?.trim() ?? "";
  const assigned = searchParams.assigned?.trim() ?? "";

  return {
    status: isInboxStatus(status) ? status : undefined,
    source: isInboxSource(source) ? source : undefined,
    assigned: assigned || undefined,
    raw: { status, source, assigned },
  };
}

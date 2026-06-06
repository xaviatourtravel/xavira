"use client";

import Link from "next/link";

import { updateKanbanLeadStatus } from "@/app/(dashboard)/leads/kanban/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type KanbanLeadItem = {
  id: string;
  full_name: string;
  status: string;
  package_interest: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  assignee_name: string | null;
  priority_score: number | null;
  updated_at: string;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

function getDaysSinceUpdate(value: string) {
  return Math.floor(
    (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function formatAgingText(daysSinceUpdate: number) {
  if (daysSinceUpdate <= 0) {
    return "Hari ini";
  }

  if (daysSinceUpdate === 1) {
    return "1 hari lalu";
  }

  return `${daysSinceUpdate} hari lalu`;
}

function getAgingBadge(daysSinceUpdate: number) {
  if (daysSinceUpdate >= 7) {
    return {
      label: "Butuh Follow Up",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (daysSinceUpdate >= 3) {
    return {
      label: "Perlu Dicek",
      className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    };
  }

  return null;
}

function getWhatsAppHref(lead: KanbanLeadItem) {
  const rawNumber = lead.whatsapp_number || lead.phone;
  if (!rawNumber) {
    return null;
  }

  const cleanNumber = rawNumber.replace(/\D/g, "");
  if (!cleanNumber) {
    return null;
  }

  return `https://wa.me/${cleanNumber}`;
}

type LeadKanbanCardProps = {
  lead: KanbanLeadItem;
};

export function LeadKanbanCard({ lead }: LeadKanbanCardProps) {
  const whatsAppHref = getWhatsAppHref(lead);
  const daysSinceUpdate = getDaysSinceUpdate(lead.updated_at);
  const agingBadge = getAgingBadge(daysSinceUpdate);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3 text-sm">
      <div>
        <p className="font-medium">{lead.full_name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {lead.package_interest || "Belum ada paket"}
        </p>
        {lead.assignee_name && (
          <p className="mt-1 text-xs text-muted-foreground">
            Assigned: {lead.assignee_name}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatAgingText(daysSinceUpdate)}
        </p>
        {agingBadge && (
          <span
            className={cn(
              "mt-2 inline-flex rounded border px-2 py-0.5 text-xs font-medium",
              agingBadge.className,
            )}
          >
            {agingBadge.label}
          </span>
        )}
        {lead.priority_score != null && (
          <p className="mt-1 text-xs text-muted-foreground">
            Priority Score: {lead.priority_score}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/leads/${lead.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "flex-1 justify-center",
          )}
        >
          View Lead
        </Link>

        {whatsAppHref && (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            WhatsApp
          </a>
        )}
      </div>

      <form action={updateKanbanLeadStatus}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <label className="sr-only" htmlFor={`status-${lead.id}`}>
          Status
        </label>
        <select
          id={`status-${lead.id}`}
          name="status"
          defaultValue={lead.status}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="w-full rounded-md border px-2 py-1.5 text-xs"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}

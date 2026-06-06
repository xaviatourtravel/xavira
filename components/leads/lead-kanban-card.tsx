"use client";

import Link from "next/link";
import { useState } from "react";

import { updateKanbanLeadStatus } from "@/app/(dashboard)/leads/kanban/actions";
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

const STATUS_BADGE_STYLES: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-sky-100 text-sky-800",
  qualified: "bg-indigo-100 text-indigo-800",
  proposal_sent: "bg-violet-100 text-violet-800",
  negotiating: "bg-amber-100 text-amber-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const compactButtonClassName =
  "inline-flex items-center justify-center rounded border px-2 py-1 text-xs font-medium";

function getStatusLabel(status: string) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status.replace(/_/g, " ")
  );
}

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

function KanbanStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        STATUS_BADGE_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

type LeadKanbanCardProps = {
  lead: KanbanLeadItem;
};

export function LeadKanbanCard({ lead }: LeadKanbanCardProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const whatsAppHref = getWhatsAppHref(lead);
  const daysSinceUpdate = getDaysSinceUpdate(lead.updated_at);
  const agingBadge = getAgingBadge(daysSinceUpdate);
  const assigneeTitle = lead.assignee_name
    ? `Assigned: ${lead.assignee_name}`
    : undefined;

  return (
    <div className="space-y-2 rounded-lg border bg-background p-2.5">
      <div className="space-y-1">
        <p
          className="truncate text-sm font-semibold leading-tight"
          title={assigneeTitle}
        >
          {lead.full_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {lead.package_interest || "Belum ada paket"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">
            {formatAgingText(daysSinceUpdate)}
          </span>
          {agingBadge && (
            <span
              className={cn(
                "inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                agingBadge.className,
              )}
            >
              {agingBadge.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {whatsAppHref && (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              compactButtonClassName,
              "border-green-600 text-green-700 hover:bg-green-50",
            )}
          >
            WA
          </a>
        )}

        <Link
          href={`/leads/${lead.id}`}
          className={cn(
            compactButtonClassName,
            "border-blue-600 text-blue-700 hover:bg-blue-50",
          )}
        >
          Detail
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-2">
        <KanbanStatusBadge status={lead.status} />

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsStatusMenuOpen((open) => !open)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Change Status
          </button>

          {isStatusMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Tutup menu status"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setIsStatusMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border bg-background p-1 shadow-sm">
                {STATUS_OPTIONS.map((option) => (
                  <form
                    key={option.value}
                    action={updateKanbanLeadStatus}
                    className="block"
                  >
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <input type="hidden" name="status" value={option.value} />
                    <button
                      type="submit"
                      disabled={option.value === lead.status}
                      className={cn(
                        "w-full rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
                        option.value === lead.status &&
                          "cursor-default text-muted-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  </form>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

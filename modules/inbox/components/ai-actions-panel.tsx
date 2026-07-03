"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  approveWhatsappAiActionAction,
  rejectWhatsappAiActionAction,
} from "@/app/(dashboard)/inbox/whatsapp-actions";
import type { AIActionStatus } from "@/modules/ai/action-engine/types";
import {
  formatAiActionConfidence,
  formatAiActionTypeLabel,
  type InboxAiActionItem,
} from "@/modules/inbox/lib/load-ai-actions";
import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import { cn } from "@/lib/utils";

type AiActionsFilter = "all" | "PENDING" | "EXECUTED" | "REJECTED" | "FAILED";

const FILTERS: Array<{ id: AiActionsFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "EXECUTED", label: "Executed" },
  { id: "REJECTED", label: "Rejected" },
  { id: "FAILED", label: "Failed" },
];

const STATUS_STYLES: Record<AIActionStatus, string> = {
  PENDING:
    "bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700",
  APPROVED:
    "bg-sky-50 text-sky-800 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/60",
  REJECTED:
    "bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/60",
  EXECUTED:
    "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/60",
  FAILED:
    "bg-red-50 text-red-800 ring-red-200/80 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800/60",
};

type AiActionsPanelProps = {
  conversationId: string;
  actions: InboxAiActionItem[];
  canManage?: boolean;
};

function StatusBadge({ status }: { status: AIActionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

function getApproveLabel(action: InboxAiActionItem) {
  if (action.actionType === "SEND_DOCUMENT") return "Send Document";
  if (action.actionType === "HANDOVER") return "Handover to Human";
  return "Approve";
}

function getRejectLabel(action: InboxAiActionItem) {
  if (action.actionType === "SEND_DOCUMENT") return "Dismiss";
  return "Reject";
}

function ActionRow({
  action,
  conversationId,
  canManage,
}: {
  action: InboxAiActionItem;
  conversationId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const showFailureReason =
    (action.status === "REJECTED" || action.status === "FAILED") &&
    action.displayReason;

  function handleApprove() {
    setNotice(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);
      formData.set("action_id", action.id);

      const result = await approveWhatsappAiActionAction(formData);
      if (!result.success) {
        setNotice(result.message ?? "Failed to approve action.");
        return;
      }

      router.refresh();
    });
  }

  function handleReject() {
    setNotice(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);
      formData.set("action_id", action.id);
      if (rejectionReason.trim()) {
        formData.set("rejection_reason", rejectionReason.trim());
      }

      const result = await rejectWhatsappAiActionAction(formData);
      if (!result.success) {
        setNotice(result.message ?? "Failed to reject action.");
        return;
      }

      setShowRejectInput(false);
      setRejectionReason("");
      router.refresh();
    });
  }

  return (
    <li className="rounded-md border border-border/70 bg-background px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-foreground">
            {formatAiActionTypeLabel(action.actionType)}
          </p>
          {action.actionType === "SEND_DOCUMENT" && action.documentName ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {action.documentName}
            </p>
          ) : null}
          {action.actionType === "HANDOVER" &&
          (action.handoffReason ||
            (action.status !== "REJECTED" &&
              action.status !== "FAILED" &&
              action.displayReason)) ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
              {action.handoffReason || action.displayReason}
            </p>
          ) : null}
        </div>
        <StatusBadge status={action.status} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
        <span className="tabular-nums">
          {formatAiActionConfidence(action.confidence)}
        </span>
        <span aria-hidden>·</span>
        <time dateTime={action.createdAt}>
          {formatInboxMessageTime(action.createdAt)}
        </time>
        {action.executedAt ? (
          <>
            <span aria-hidden>·</span>
            <time dateTime={action.executedAt}>
              Executed {formatInboxMessageTime(action.executedAt)}
            </time>
          </>
        ) : null}
      </div>

      {action.actionType !== "HANDOVER" &&
      action.displayReason &&
      action.status !== "REJECTED" &&
      action.status !== "FAILED" ? (
        <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
          {action.displayReason}
        </p>
      ) : null}

      {showFailureReason ? (
        <p className="mt-1 line-clamp-2 text-[10px] text-amber-800 dark:text-amber-200">
          {action.displayReason}
        </p>
      ) : null}

      {canManage && action.status === "PENDING" ? (
        <div className="mt-2 space-y-1.5">
          {showRejectInput ? (
            <div className="space-y-1.5">
              <input
                type="text"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Rejection reason (optional)"
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                disabled={isPending}
              />
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleReject}
                  className="rounded-md bg-amber-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-800 disabled:opacity-60 dark:bg-amber-600"
                >
                  {isPending ? "Saving..." : getRejectLabel(action)}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                  }}
                  className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted/60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={isPending}
                onClick={handleApprove}
                className="rounded-md bg-emerald-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600"
              >
                {isPending ? "Working..." : getApproveLabel(action)}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowRejectInput(true)}
                className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:bg-muted/60 disabled:opacity-60"
              >
                {getRejectLabel(action)}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {notice ? (
        <p className="mt-1.5 text-[10px] text-red-600 dark:text-red-400">
          {notice}
        </p>
      ) : null}
    </li>
  );
}

export function AiActionsPanel({
  conversationId,
  actions,
  canManage = false,
}: AiActionsPanelProps) {
  const [filter, setFilter] = useState<AiActionsFilter>("all");

  const filteredActions = useMemo(() => {
    if (filter === "all") return actions;
    return actions.filter((action) => action.status === filter);
  }, [actions, filter]);

  const pendingCount = actions.filter(
    (action) => action.status === "PENDING",
  ).length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
              {item.id === "PENDING" && pendingCount > 0
                ? ` ${pendingCount}`
                : ""}
            </button>
          );
        })}
      </div>

      {filteredActions.length > 0 ? (
        <ul className="space-y-1.5">
          {filteredActions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              conversationId={conversationId}
              canManage={canManage}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
          {actions.length === 0
            ? "No AI actions yet."
            : "No actions match this filter."}
        </p>
      )}
    </div>
  );
}

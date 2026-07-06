"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, ExternalLink } from "lucide-react";

import {
  approveWorkspaceAiActionAction,
  cancelScheduledWorkspaceAiActionAction,
  executeScheduledWorkspaceAiActionNowAction,
  rejectWorkspaceAiActionAction,
  retryWorkspaceAiActionAction,
} from "@/app/(dashboard)/ai-actions/actions";
import { formatScheduledActionTime } from "@/modules/ai/action-engine/schedule-utils";
import { formatRetryCount } from "@/modules/ai/action-engine/retry-metadata";
import { DsEmptyState } from "@/components/design-system/empty-state";
import { DsCard } from "@/components/design-system/card";
import type { AIActionStatus } from "@/modules/ai/action-engine/types";
import { useAiActionsQueueRealtime } from "@/modules/inbox/hooks/use-ai-actions-queue-realtime";
import {
  formatAiActionConfidence,
  formatAiActionTypeLabel,
} from "@/modules/inbox/lib/load-ai-actions";
import {
  formatPayloadPreview,
  getWorkspaceAiActionTypeOptions,
  type WorkspaceAiActionItem,
  type WorkspaceAiActionTab,
} from "@/modules/inbox/lib/load-workspace-ai-actions";
import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import { cn } from "@/lib/utils";

const TABS: Array<{ id: WorkspaceAiActionTab; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "scheduled", label: "Scheduled" },
  { id: "executed", label: "Executed" },
  { id: "rejected", label: "Rejected" },
  { id: "failed", label: "Failed" },
  { id: "all", label: "All" },
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
  SCHEDULED:
    "bg-violet-50 text-violet-800 ring-violet-200/80 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-800/60",
};

type AiActionsQueuePageClientProps = {
  actions: WorkspaceAiActionItem[];
  organizationId: string;
  workspaceName: string | null;
  pendingCount: number;
  scheduledCount: number;
  activeTab: WorkspaceAiActionTab;
  filters: {
    actionType: string;
    confidenceMin: string;
    createdFrom: string;
    createdTo: string;
  };
};

function StatusBadge({ status }: { status: AIActionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

function PendingActionCard({
  action,
  canManage,
}: {
  action: WorkspaceAiActionItem;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const reason =
    action.actionType === "HANDOVER"
      ? action.handoffReason || action.displayReason
      : action.displayReason;

  function handleApprove() {
    setNotice(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", action.conversationId);
      formData.set("action_id", action.id);

      const result = await approveWorkspaceAiActionAction(formData);
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
      formData.set("conversation_id", action.conversationId);
      formData.set("action_id", action.id);
      if (rejectionReason.trim()) {
        formData.set("rejection_reason", rejectionReason.trim());
      }

      const result = await rejectWorkspaceAiActionAction(formData);
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
    <DsCard className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Action Type
          </p>
          <p className="text-base font-semibold text-foreground">
            {formatAiActionTypeLabel(action.actionType)}
          </p>
          {action.actionType === "SEND_DOCUMENT" && action.documentName ? (
            <p className="text-sm text-muted-foreground">{action.documentName}</p>
          ) : null}
        </div>
        <StatusBadge status={action.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Conversation
          </p>
          <Link
            href={`/inbox?c=${action.conversation.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open conversation
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Customer
          </p>
          <p className="text-sm font-medium text-foreground">
            {action.conversation.customerName}
          </p>
          {action.conversation.phoneLabel ? (
            <p className="text-xs text-muted-foreground">
              {action.conversation.phoneLabel}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Confidence
          </p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatAiActionConfidence(action.confidence)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Created At
          </p>
          <time
            dateTime={action.createdAt}
            className="text-sm text-foreground"
          >
            {formatInboxMessageTime(action.createdAt)}
          </time>
        </div>
      </div>

      {reason ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reason
          </p>
          <p className="text-sm text-foreground">{reason}</p>
        </div>
      ) : null}

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Payload Preview
        </p>
        <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
          {formatPayloadPreview(action.payload)}
        </pre>
      </div>

      {canManage && action.status === "PENDING" ? (
        <div className="space-y-2 border-t border-border pt-4">
          {showRejectInput ? (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Rejection reason (optional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                disabled={isPending}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleReject}
                  className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60 dark:bg-amber-600"
                >
                  {isPending ? "Saving..." : "Reject"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleApprove}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600"
              >
                {isPending ? "Working..." : "Approve"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowRejectInput(true)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ) : null}

      {notice ? (
        <p className="text-sm text-red-600 dark:text-red-400">{notice}</p>
      ) : null}
    </DsCard>
  );
}

function ScheduledActionCard({
  action,
  canManage,
}: {
  action: WorkspaceAiActionItem;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const reason = action.displayReason;

  function handleExecuteNow() {
    setNotice(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", action.conversationId);
      formData.set("action_id", action.id);

      const result = await executeScheduledWorkspaceAiActionNowAction(formData);
      if (!result.success) {
        setNotice(result.message ?? "Failed to execute action.");
        return;
      }

      router.refresh();
    });
  }

  function handleCancel() {
    setNotice(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", action.conversationId);
      formData.set("action_id", action.id);

      const result = await cancelScheduledWorkspaceAiActionAction(formData);
      if (!result.success) {
        setNotice(result.message ?? "Failed to cancel action.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <DsCard className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Action Type
          </p>
          <p className="text-base font-semibold text-foreground">
            {formatAiActionTypeLabel(action.actionType)}
          </p>
          {action.actionType === "SEND_DOCUMENT" && action.documentName ? (
            <p className="text-sm text-muted-foreground">{action.documentName}</p>
          ) : null}
        </div>
        <StatusBadge status={action.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Customer
          </p>
          <p className="text-sm font-medium text-foreground">
            {action.conversation.customerName}
          </p>
          {action.conversation.phoneLabel ? (
            <p className="text-xs text-muted-foreground">
              {action.conversation.phoneLabel}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Scheduled For
          </p>
          <p className="text-sm font-medium text-foreground">
            {action.scheduledFor
              ? formatScheduledActionTime(action.scheduledFor)
              : "—"}
          </p>
        </div>
      </div>

      {reason ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reason
          </p>
          <p className="text-sm text-foreground">{reason}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{formatAiActionConfidence(action.confidence)} confidence</span>
        <Link
          href={`/inbox?c=${action.conversation.id}`}
          className="font-medium text-primary hover:underline"
        >
          View conversation
        </Link>
      </div>

      {canManage ? (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <button
            type="button"
            disabled={isPending}
            onClick={handleExecuteNow}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600"
          >
            {isPending ? "Working..." : "Execute Now"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleCancel}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {notice ? (
        <p className="text-sm text-red-600 dark:text-red-400">{notice}</p>
      ) : null}
    </DsCard>
  );
}

function FailedActionCard({
  action,
  canManage,
}: {
  action: WorkspaceAiActionItem;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const reason =
    action.actionType === "HANDOVER"
      ? action.handoffReason || action.displayReason
      : action.displayReason;

  const retryLabel = formatRetryCount(action.metadata);

  function handleRetry() {
    setNotice(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", action.conversationId);
      formData.set("action_id", action.id);

      const result = await retryWorkspaceAiActionAction(formData);
      if (!result.success) {
        setNotice(result.message ?? "Failed to retry action.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <DsCard className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatAiActionTypeLabel(action.actionType)}
          </p>
          <p className="text-sm text-muted-foreground">
            {action.conversation.customerName}
            {action.conversation.phoneLabel
              ? ` · ${action.conversation.phoneLabel}`
              : ""}
          </p>
          {action.actionType === "SEND_DOCUMENT" && action.documentName ? (
            <p className="text-xs text-muted-foreground">{action.documentName}</p>
          ) : null}
        </div>
        <StatusBadge status={action.status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{formatAiActionConfidence(action.confidence)} confidence</span>
        <time dateTime={action.createdAt}>
          {formatInboxMessageTime(action.createdAt)}
        </time>
        <Link
          href={`/inbox?c=${action.conversation.id}`}
          className="font-medium text-primary hover:underline"
        >
          View conversation
        </Link>
      </div>

      {reason ? <p className="text-sm text-foreground">{reason}</p> : null}

      {action.displayReason ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {action.displayReason}
        </p>
      ) : null}

      {retryLabel ? (
        <p className="text-xs font-medium text-muted-foreground">{retryLabel}</p>
      ) : null}

      {action.metadata.lastRetryError ? (
        <p className="text-xs text-red-600 dark:text-red-400">
          Last retry: {action.metadata.lastRetryError}
        </p>
      ) : null}

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Payload Preview
        </p>
        <pre className="max-h-32 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
          {formatPayloadPreview(action.payload)}
        </pre>
      </div>

      {canManage ? (
        <div className="border-t border-border pt-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRetry}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? "Retrying..." : "Retry"}
          </button>
        </div>
      ) : null}

      {notice ? (
        <p className="text-sm text-red-600 dark:text-red-400">{notice}</p>
      ) : null}
    </DsCard>
  );
}

function HistoryActionCard({ action }: { action: WorkspaceAiActionItem }) {
  const reason =
    action.actionType === "HANDOVER"
      ? action.handoffReason || action.displayReason
      : action.displayReason;

  return (
    <DsCard className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatAiActionTypeLabel(action.actionType)}
          </p>
          <p className="text-sm text-muted-foreground">
            {action.conversation.customerName}
            {action.conversation.phoneLabel
              ? ` · ${action.conversation.phoneLabel}`
              : ""}
          </p>
        </div>
        <StatusBadge status={action.status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{formatAiActionConfidence(action.confidence)} confidence</span>
        <time dateTime={action.createdAt}>
          {formatInboxMessageTime(action.createdAt)}
        </time>
        <Link
          href={`/inbox?c=${action.conversation.id}`}
          className="font-medium text-primary hover:underline"
        >
          View conversation
        </Link>
      </div>

      {reason ? <p className="text-sm text-foreground">{reason}</p> : null}

      {(action.status === "REJECTED" || action.status === "FAILED") &&
      action.displayReason ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {action.displayReason}
        </p>
      ) : null}
    </DsCard>
  );
}

export function AiActionsQueuePageClient({
  actions,
  organizationId,
  workspaceName,
  pendingCount,
  scheduledCount,
  activeTab,
  filters,
}: AiActionsQueuePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionTypeOptions = useMemo(() => getWorkspaceAiActionTypeOptions(), []);

  useAiActionsQueueRealtime({ organizationId });

  function buildTabHref(tab: WorkspaceAiActionTab) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", tab);
    return `/ai-actions?${params.toString()}`;
  }

  const emptyTitle =
    activeTab === "pending"
      ? "No AI actions need review."
      : activeTab === "scheduled"
        ? "No scheduled AI actions."
        : "No AI actions match this view.";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          AI Actions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review actions your AI wants to perform.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={buildTabHref(tab.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.id === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              {tab.id === "scheduled" && scheduledCount > 0
                ? ` (${scheduledCount})`
                : ""}
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <input type="hidden" name="tab" value={activeTab} />

        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Action Type</span>
          <select
            name="actionType"
            defaultValue={filters.actionType}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {actionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Workspace</span>
          <select
            name="workspace"
            defaultValue={organizationId}
            disabled
            className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          >
            <option value={organizationId}>
              {workspaceName ?? "Current workspace"}
            </option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Min Confidence</span>
          <select
            name="confidenceMin"
            defaultValue={filters.confidenceMin}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="0.5">50%+</option>
            <option value="0.7">70%+</option>
            <option value="0.85">85%+</option>
            <option value="0.95">95%+</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Created From</span>
          <input
            type="date"
            name="createdFrom"
            defaultValue={filters.createdFrom}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Created To</span>
          <input
            type="date"
            name="createdTo"
            defaultValue={filters.createdTo}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-5">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={() => router.push(`/ai-actions?tab=${activeTab}`)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            Reset
          </button>
        </div>
      </form>

      {actions.length === 0 ? (
        <DsEmptyState
          icon={Bot}
          title={emptyTitle}
          description={
            activeTab === "pending"
              ? "When the AI recommends an action that needs approval, it will appear here."
              : activeTab === "scheduled"
                ? "When the AI schedules a follow-up or delayed action, it will appear here."
                : "Try another tab or adjust your filters."
          }
        />
      ) : (
        <div className="space-y-4">
          {actions.map((action) =>
            action.status === "PENDING" ? (
              <PendingActionCard
                key={action.id}
                action={action}
                canManage
              />
            ) : action.status === "SCHEDULED" ? (
              <ScheduledActionCard key={action.id} action={action} canManage />
            ) : action.status === "FAILED" ? (
              <FailedActionCard key={action.id} action={action} canManage />
            ) : (
              <HistoryActionCard key={action.id} action={action} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

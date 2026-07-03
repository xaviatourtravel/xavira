"use client";

import { Bot, Loader2, Pencil } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { DsTextarea } from "@/components/design-system/form-controls";
import type {
  PlaygroundFeedbackStatus,
  PlaygroundPreviewResult,
} from "@/modules/business-brain/types/playground";
import { cn } from "@/lib/utils";

type PlaygroundPreviewPanelProps = {
  preview: PlaygroundPreviewResult | null;
  editedReply: string;
  isEditing: boolean;
  isRunning: boolean;
  feedbackStatus: PlaygroundFeedbackStatus;
  canEdit: boolean;
  isSavingExample: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  onEditedReplyChange: (value: string) => void;
  onApprove: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onReject: () => void;
  onSaveExample: () => void;
};

function MetricPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          tone === "success" && "text-emerald-600 dark:text-emerald-400",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "danger" && "text-destructive",
          tone === "default" && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
      {label}
    </span>
  );
}

function UsedSourcesSection({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Used Sources
        </p>
        <p className="text-sm text-muted-foreground">No Business Brain sources were referenced.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Used Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <SourceBadge key={label} label={label} />
        ))}
      </div>
    </div>
  );
}

function RecommendedDocumentActionsSection({
  actions,
}: {
  actions: PlaygroundPreviewResult["documentActions"];
}) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Recommended Document Actions
      </p>
      <ul className="space-y-2">
        {actions.map((action) => (
          <li
            key={`${action.documentId}-${action.reason}`}
            className="rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <p className="text-sm font-medium text-foreground">
              Send {action.documentName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reason: {action.reason}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Confidence: {action.confidence.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlaygroundPreviewPanel({
  preview,
  editedReply,
  isEditing,
  isRunning,
  feedbackStatus,
  canEdit,
  isSavingExample,
  statusMessage,
  errorMessage,
  onEditedReplyChange,
  onApprove,
  onEdit,
  onCancelEdit,
  onReject,
  onSaveExample,
}: PlaygroundPreviewPanelProps) {
  if (isRunning) {
    return (
      <DsCard
        title="AI Preview Reply"
        description="Generating preview from your draft Business Brain."
        className="min-h-[420px]"
      >
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Testing AI...</p>
          <p className="text-xs text-muted-foreground">
            Building context, prompt, and calling the LLM.
          </p>
        </div>
      </DsCard>
    );
  }

  if (!preview) {
    return (
      <DsCard
        title="AI Preview Reply"
        description="Run a test to see how AI would respond."
        className="min-h-[420px]"
      >
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter a customer message and click Run Test to preview the AI reply.
            </p>
          )}
        </div>
      </DsCard>
    );
  }

  const displayReply = isEditing ? editedReply : editedReply || preview.aiReply;

  return (
    <DsCard title="AI Preview Reply" description="Live AI preview from your draft Business Brain.">
      <div className="space-y-4">
        <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Reply
            </p>
            {isEditing ? (
              <DsTextarea
                value={editedReply}
                onChange={(event) => onEditedReplyChange(event.target.value)}
                rows={6}
                disabled={!canEdit}
              />
            ) : (
              <p className="text-sm leading-relaxed text-foreground">{displayReply}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MetricPill label="Confidence" value={`${preview.confidence}%`} tone="success" />
          <MetricPill
            label="Handoff Required"
            value={preview.handoffRequired ? "Yes" : "No"}
            tone={preview.handoffRequired ? "warning" : "default"}
          />
        </div>

        {preview.handoffRequired && preview.handoffReason ? (
          <div className="rounded-xl border border-amber-300/40 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Handoff Reason
            </p>
            <p className="mt-1 text-sm text-amber-950 dark:text-amber-100">{preview.handoffReason}</p>
          </div>
        ) : null}

        <UsedSourcesSection labels={preview.sourceLabels} />

        <RecommendedDocumentActionsSection actions={preview.documentActions} />

        {preview.suggestedActions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Suggested Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {preview.suggestedActions.map((action) => (
                <SourceBadge key={action} label={action} />
              ))}
            </div>
          </div>
        ) : null}

        {feedbackStatus !== "idle" ? (
          <p
            className={cn(
              "text-sm",
              feedbackStatus === "approved" && "text-emerald-600 dark:text-emerald-400",
              feedbackStatus === "rejected" && "text-destructive",
              feedbackStatus === "edited" && "text-primary",
            )}
          >
            {feedbackStatus === "approved" && "Preview approved."}
            {feedbackStatus === "rejected" && "Preview rejected."}
            {feedbackStatus === "edited" && "Reply edited locally."}
          </p>
        ) : null}

        {statusMessage ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{statusMessage}</p>
        ) : null}

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        {canEdit ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <DsButton type="button" variant="outline" size="sm" onClick={onApprove}>
              Approve
            </DsButton>
            {isEditing ? (
              <DsButton type="button" variant="outline" size="sm" onClick={onCancelEdit}>
                Done Editing
              </DsButton>
            ) : (
              <DsButton type="button" variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit Reply
              </DsButton>
            )}
            <DsButton type="button" variant="outline" size="sm" onClick={onReject}>
              Reject
            </DsButton>
            <DsButton
              type="button"
              size="sm"
              onClick={onSaveExample}
              loading={isSavingExample}
              disabled={!displayReply.trim()}
            >
              Save as Example
            </DsButton>
          </div>
        ) : null}
      </div>
    </DsCard>
  );
}

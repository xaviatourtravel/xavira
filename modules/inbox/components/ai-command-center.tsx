"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  HandHelping,
  Sparkles,
  X,
} from "lucide-react";

import {
  sendWhatsappDocumentAction,
  takeOverWhatsappConversationAction,
  updateWhatsappConversationAiStateAction,
} from "@/app/(dashboard)/inbox/whatsapp-actions";
import { refreshBrainDocumentPreviewAction } from "@/modules/business-brain/actions/document-actions";
import {
  buildCommandCenterMemoryFields,
  buildCommandCenterNextAction,
  buildCommandCenterStats,
  buildCommandCenterSummaryLines,
  filterCommandCenterActivity,
  formatCommandCenterActivityLabel,
  getMemoryLastUpdated,
  getQualificationFieldRows,
  type RecommendedDocumentItem,
} from "@/modules/inbox/lib/build-ai-command-center";
import { AiActionsPanel } from "@/modules/inbox/components/ai-actions-panel";
import { useAiCommandCenterRealtime } from "@/modules/inbox/hooks/use-ai-command-center-realtime";
import {
  formatWhatsappAiStateLabel,
  resolveWhatsappAiState,
  WHATSAPP_AI_STATES,
} from "@/lib/whatsapp-inbox/ai/constants";
import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";
import { cn } from "@/lib/utils";

type AiCommandCenterProps = {
  conversation: OmnichannelConversationDetail;
  organizationId: string;
  canManageAi?: boolean;
};

const STATE_STYLES: Record<WhatsappAiState, string> = {
  AI_ACTIVE:
    "bg-sky-50 text-sky-800 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800/60",
  READY_FOR_HUMAN:
    "bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/60",
  HUMAN_ASSISTED:
    "bg-violet-50 text-violet-800 ring-violet-200/80 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-800/60",
  HUMAN_ONLY:
    "bg-slate-100 text-slate-800 ring-slate-200/80 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700",
};

function CollapsibleCard({
  title,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
          {badge}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="px-3 pb-3">{children}</div> : null}
    </section>
  );
}

function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
      {children}
    </p>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5 dark:bg-muted/20">
      <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-[11px] font-medium text-foreground">{value}</p>
    </div>
  );
}

export function AiCommandCenter({
  conversation,
  organizationId,
  canManageAi = false,
}: AiCommandCenterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [sendingDocId, setSendingDocId] = useState<string | null>(null);

  const isWhatsapp = conversation.channel === "whatsapp";

  useAiCommandCenterRealtime({
    conversationId: isWhatsapp ? conversation.id : null,
    organizationId,
    enabled: isWhatsapp,
  });

  const aiState = resolveWhatsappAiState(conversation.aiState);
  const qualification = conversation.leadQualification;
  const memory = conversation.conversationMemory;
  const documents = conversation.recommendedDocuments ?? [];

  const qualificationRows = useMemo(
    () => getQualificationFieldRows(qualification),
    [qualification],
  );
  const memoryFields = useMemo(
    () => buildCommandCenterMemoryFields(memory),
    [memory],
  );
  const memoryLastUpdated = useMemo(() => getMemoryLastUpdated(memory), [memory]);
  const summaryLines = useMemo(
    () =>
      buildCommandCenterSummaryLines({
        leadQualification: qualification,
        conversationMemory: memory,
      }),
    [qualification, memory],
  );
  const nextAction = useMemo(
    () =>
      buildCommandCenterNextAction({
        aiState: conversation.aiState,
        leadQualification: qualification,
        conversationMemory: memory,
      }),
    [conversation.aiState, qualification, memory],
  );
  const activity = useMemo(
    () => filterCommandCenterActivity(conversation.aiActivityEvents, 5),
    [conversation.aiActivityEvents],
  );
  const stats = useMemo(
    () =>
      buildCommandCenterStats({
        createdAt: conversation.createdAt,
        messages: conversation.messages,
        aiActivityEvents: conversation.aiActivityEvents,
      }),
    [conversation.createdAt, conversation.messages, conversation.aiActivityEvents],
  );

  const hasMemory = memoryFields.some((field) => field.value);
  const completionScore = qualification?.completionScore ?? 0;

  function runAiStateUpdate(nextState: WhatsappAiState) {
    if (!canManageAi || nextState === aiState) return;
    setNotice(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversation.id);
      formData.set("ai_state", nextState);

      const result = await updateWhatsappConversationAiStateAction(formData);
      if (!result.success) {
        setNotice(result.message ?? "Failed to update AI state.");
        return;
      }
      router.refresh();
    });
  }

  function handlePrimaryAction() {
    if (!canManageAi) return;
    setNotice(null);

    if (nextAction.id === "take_over" || nextAction.id === "handover") {
      startTransition(async () => {
        const formData = new FormData();
        formData.set("conversation_id", conversation.id);
        const result = await takeOverWhatsappConversationAction(formData);
        if (!result.success) {
          setNotice(result.message ?? "Failed to take over.");
          return;
        }
        router.refresh();
      });
      return;
    }

    setNotice(
      nextAction.id === "ask_budget"
        ? "Ask the customer for their budget in chat."
        : nextAction.id === "recommend_package"
          ? "Recommend a package in chat based on collected details."
          : "Use Documents below to send a brochure.",
    );
  }

  async function handlePreview(document: RecommendedDocumentItem) {
    setNotice(null);
    if (document.previewUrl) {
      window.open(document.previewUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const result = await refreshBrainDocumentPreviewAction(document.id);
    if (!result.ok || !("previewUrl" in result) || !result.previewUrl) {
      setNotice("No preview available for this document.");
      return;
    }
    window.open(result.previewUrl, "_blank", "noopener,noreferrer");
  }

  function handleSendDocument(document: RecommendedDocumentItem) {
    if (!canManageAi) return;
    setNotice(null);
    setSendingDocId(document.id);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversation.id);
      formData.set("document_id", document.id);

      const result = await sendWhatsappDocumentAction(formData);
      setSendingDocId(null);

      if (!result.success) {
        setNotice(result.message ?? "Failed to send document.");
        return;
      }

      setNotice("Document sent.");
      router.refresh();
    });
  }

  if (!isWhatsapp) {
    return (
      <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
        AI Command Center is available for WhatsApp conversations.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* A. AI Status */}
        <CollapsibleCard
          title="AI Status"
          badge={
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                STATE_STYLES[aiState],
              )}
            >
              {aiState === "AI_ACTIVE" ? <Bot className="h-3 w-3" /> : null}
              {formatWhatsappAiStateLabel(aiState)}
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            {WHATSAPP_AI_STATES.map((state) => {
              const active = state === aiState;
              return (
                <button
                  key={state}
                  type="button"
                  disabled={!canManageAi || isPending || active}
                  onClick={() => runAiStateUpdate(state)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-left text-[11px] font-medium ring-1 ring-inset transition-colors",
                    active
                      ? STATE_STYLES[state]
                      : "bg-background text-muted-foreground ring-border hover:bg-muted/50 hover:text-foreground disabled:opacity-50",
                  )}
                >
                  {formatWhatsappAiStateLabel(state)}
                </button>
              );
            })}
          </div>
          {conversation.aiHandoffReason?.trim() ? (
            <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-200">
              {conversation.aiHandoffReason}
            </p>
          ) : null}
        </CollapsibleCard>

        {/* B. Lead Qualification */}
        <CollapsibleCard
          title="Lead Qualification"
          badge={
            <span className="text-[10px] font-semibold tabular-nums text-foreground">
              {completionScore}%
            </span>
          }
        >
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-400"
              style={{ width: `${Math.min(100, Math.max(0, completionScore))}%` }}
            />
          </div>
          <ul className="space-y-1">
            {qualificationRows.map((field) => (
              <li
                key={field.key}
                className="flex items-center gap-2 text-[11px] text-foreground"
              >
                {field.completed ? (
                  <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                )}
                <span className={cn(!field.completed && "text-muted-foreground")}>
                  {field.label}
                </span>
                {field.value ? (
                  <span className="ml-auto truncate text-muted-foreground">
                    {field.value}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </CollapsibleCard>

        {/* C. Customer Memory */}
        <CollapsibleCard title="Customer Memory" defaultOpen={hasMemory}>
          {hasMemory ? (
            <dl className="grid grid-cols-2 gap-1.5">
              {memoryFields.map((field) => (
                <div key={field.key} className="min-w-0">
                  <dt className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="truncate text-[11px] text-foreground">
                    {field.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <EmptyHint>No memory extracted yet.</EmptyHint>
          )}
          {memoryLastUpdated ? (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Last updated {formatInboxMessageTime(memoryLastUpdated)}
            </p>
          ) : null}
        </CollapsibleCard>

        {/* D. AI Summary */}
        <CollapsibleCard title="AI Summary">
          {summaryLines.length > 0 ? (
            <div className="rounded-md border border-border/80 bg-muted/30 p-2.5 dark:bg-muted/15">
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Snapshot
              </div>
              <ul className="space-y-1">
                {summaryLines.map((line) => (
                  <li key={line} className="text-[11px] leading-snug text-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyHint>No summary yet. AI will build one as details are collected.</EmptyHint>
          )}
        </CollapsibleCard>

        {/* E. Suggested Next Action */}
        <CollapsibleCard title="Suggested Next Action">
          <div className="rounded-md border border-sky-200/80 bg-sky-50/70 p-2.5 dark:border-sky-900/60 dark:bg-sky-950/30">
            <p className="text-[12px] font-semibold text-sky-950 dark:text-sky-100">
              {nextAction.label}
            </p>
            <p className="mt-0.5 text-[11px] text-sky-900/80 dark:text-sky-200/80">
              {nextAction.description}
            </p>
            {canManageAi ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handlePrimaryAction}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-800 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
              >
                {(nextAction.id === "take_over" || nextAction.id === "handover") && (
                  <HandHelping className="h-3.5 w-3.5" />
                )}
                {isPending ? "Working..." : nextAction.label}
              </button>
            ) : null}
          </div>
        </CollapsibleCard>

        {/* F. Documents */}
        <CollapsibleCard title="Documents" defaultOpen={documents.length > 0}>
          {documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-start gap-2 rounded-md border border-border/70 bg-background px-2 py-1.5"
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-foreground">
                      {document.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => void handlePreview(document)}
                        className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted/60"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Preview
                      </button>
                      {canManageAi ? (
                        <button
                          type="button"
                          disabled={isPending || sendingDocId === document.id}
                          onClick={() => handleSendDocument(document)}
                          className="rounded border border-border bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background hover:opacity-90 disabled:opacity-60"
                        >
                          {sendingDocId === document.id ? "Sending..." : "Send"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>No documents recommended for this conversation.</EmptyHint>
          )}
        </CollapsibleCard>

        {/* G. AI Actions */}
        <CollapsibleCard
          title="AI Actions"
          defaultOpen={(conversation.aiActions?.length ?? 0) > 0}
          badge={
            (conversation.aiActions?.length ?? 0) > 0 ? (
              <span className="text-[10px] font-semibold tabular-nums text-foreground">
                {conversation.aiActions?.length}
              </span>
            ) : null
          }
        >
          <AiActionsPanel
            conversationId={conversation.id}
            actions={conversation.aiActions ?? []}
            canManage={canManageAi}
          />
        </CollapsibleCard>

        {/* H. AI Activity */}
        <CollapsibleCard title="AI Activity" defaultOpen={activity.length > 0}>
          {activity.length > 0 ? (
            <ul className="space-y-1.5">
              {activity.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-2 text-[11px]"
                >
                  <span className="min-w-0 text-foreground">
                    {formatCommandCenterActivityLabel(event)}
                  </span>
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {formatInboxMessageTime(event.timestamp)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>No AI activity yet.</EmptyHint>
          )}
        </CollapsibleCard>

        {/* I. Conversation Stats */}
        <CollapsibleCard title="Conversation Stats" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-1.5">
            <StatCell
              label="Customer Since"
              value={
                stats.customerSince
                  ? formatInboxMessageTime(stats.customerSince)
                  : "—"
              }
            />
            <StatCell label="Reply Time" value={stats.replyTimeLabel ?? "—"} />
            <StatCell label="AI Messages" value={String(stats.aiMessageCount)} />
            <StatCell
              label="Human Messages"
              value={String(stats.humanMessageCount)}
            />
            <StatCell
              label="Last AI Reply"
              value={
                stats.lastAiReplyAt
                  ? formatInboxMessageTime(stats.lastAiReplyAt)
                  : "—"
              }
            />
          </div>
        </CollapsibleCard>
      </div>

      {notice ? (
        <p className="shrink-0 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

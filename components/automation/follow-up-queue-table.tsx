"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { generateAiSalesAssistant } from "@/app/(dashboard)/leads/[id]/ai-actions";
import { completeFollowUpFromQueue } from "@/app/(dashboard)/follow-ups/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getQueuePriorityBadgeClass,
  type QueuePriority,
} from "@/lib/automation/constants";
import type { FollowUpQueueItem } from "@/lib/automation/queue";
import { getLeadTemperatureBadgeClassName } from "@/lib/leads/lead-temperature";
import { getLeadWhatsAppPhone } from "@/lib/leads/next-best-action";

type FollowUpQueueTableProps = {
  items: FollowUpQueueItem[];
};

type LeadDraftState = {
  message: string;
  generatedAt: string;
};

type DraftModalState = {
  leadId: string;
  leadName: string;
  message: string;
  whatsappNumber: string | null;
  phone: string | null;
};

type CompletingQueueItem = {
  leadId: string;
  leadName: string;
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

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

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function buildWhatsAppHref(
  message: string,
  whatsappNumber: string | null,
  phone: string | null,
) {
  const cleanPhone = getLeadWhatsAppPhone(whatsappNumber, phone);

  if (!cleanPhone) {
    return null;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

type GeneratedFollowUpModalProps = {
  draft: DraftModalState;
  copyFeedback: string | null;
  onClose: () => void;
  onCopy: () => void;
};

function GeneratedFollowUpModal({
  draft,
  copyFeedback,
  onClose,
  onCopy,
}: GeneratedFollowUpModalProps) {
  const whatsAppHref = buildWhatsAppHref(
    draft.message,
    draft.whatsappNumber,
    draft.phone,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Tutup modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border bg-background shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generated-follow-up-title"
      >
        <div className="border-b px-6 py-4">
          <h3 id="generated-follow-up-title" className="text-lg font-semibold">
            AI Generated Follow Up
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{draft.leadName}</p>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
            {draft.message}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <div className="text-sm text-green-700">{copyFeedback}</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onCopy}>
              Salin Pesan
            </Button>
            {whatsAppHref && (
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants())}
              >
                Buka WhatsApp
              </a>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type CompleteFollowUpModalProps = {
  item: CompletingQueueItem;
  error: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
};

function CompleteFollowUpModal({
  item,
  error,
  isPending,
  onClose,
  onSubmit,
}: CompleteFollowUpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Tutup modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-follow-up-title"
      >
        <h3 id="complete-follow-up-title" className="text-lg font-semibold">
          Selesaikan Follow Up
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.leadName}</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="lead_id" value={item.leadId} />

          <div>
            <label htmlFor="completion_note" className="text-sm font-medium">
              Catatan hasil follow up
            </label>
            <textarea
              id="completion_note"
              name="completion_note"
              rows={4}
              className={inputClassName}
              placeholder="Contoh: Lead sudah dihubungi dan minta kirim proposal."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan & Selesai"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type QueueAiCellProps = {
  item: FollowUpQueueItem;
  draft: LeadDraftState | undefined;
  onDraftGenerated: (item: FollowUpQueueItem, message: string) => void;
  onViewDraft: (item: FollowUpQueueItem, message: string) => void;
};

function QueueAiCell({
  item,
  draft,
  onDraftGenerated,
  onViewDraft,
}: QueueAiCellProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);

    const formData = new FormData();
    formData.set("lead_id", item.leadId);
    formData.set("action", "follow_up");

    startTransition(async () => {
      const result = await generateAiSalesAssistant(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      onDraftGenerated(item, result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={isPending}
      >
        {isPending ? "Generating..." : "Generate Follow Up"}
      </Button>

      {draft ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-green-700">Draft siap</p>
          <p className="text-xs text-muted-foreground">
            Terakhir generate: {formatDateTime(draft.generatedAt)}
          </p>
          <button
            type="button"
            onClick={() => onViewDraft(item, draft.message)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Lihat Draft
          </button>
        </div>
      ) : null}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FollowUpQueueTable({ items }: FollowUpQueueTableProps) {
  const router = useRouter();
  const [draftsByLeadId, setDraftsByLeadId] = useState<
    Record<string, LeadDraftState>
  >({});
  const [modalDraft, setModalDraft] = useState<DraftModalState | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [completingItem, setCompletingItem] =
    useState<CompletingQueueItem | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isCompleting, startCompleteTransition] = useTransition();

  function handleDraftGenerated(item: FollowUpQueueItem, message: string) {
    const generatedAt = new Date().toISOString();

    setDraftsByLeadId((current) => ({
      ...current,
      [item.leadId]: { message, generatedAt },
    }));

    setCopyFeedback(null);
    setModalDraft({
      leadId: item.leadId,
      leadName: item.leadName,
      message,
      whatsappNumber: item.whatsappNumber,
      phone: item.phone,
    });
  }

  function handleViewDraft(item: FollowUpQueueItem, message: string) {
    setCopyFeedback(null);
    setModalDraft({
      leadId: item.leadId,
      leadName: item.leadName,
      message,
      whatsappNumber: item.whatsappNumber,
      phone: item.phone,
    });
  }

  async function handleCopyDraft() {
    if (!modalDraft) {
      return;
    }

    try {
      await navigator.clipboard.writeText(modalDraft.message);
      setCopyFeedback("Pesan berhasil disalin");
    } catch {
      setCopyFeedback("Gagal menyalin pesan");
    }

    window.setTimeout(() => {
      setCopyFeedback(null);
    }, 3000);
  }

  function handleCloseModal() {
    setModalDraft(null);
    setCopyFeedback(null);
  }

  function handleOpenComplete(item: FollowUpQueueItem) {
    setCompleteError(null);
    setCompletingItem({
      leadId: item.leadId,
      leadName: item.leadName,
    });
  }

  function handleCloseComplete() {
    setCompletingItem(null);
    setCompleteError(null);
  }

  function handleCompleteSubmit(formData: FormData) {
    setCompleteError(null);

    startCompleteTransition(async () => {
      const result = await completeFollowUpFromQueue(formData);

      if (!result.success) {
        setCompleteError(result.message);
        return;
      }

      const completedLeadId = completingItem?.leadId;

      setCompletingItem(null);
      setCompleteError(null);

      if (completedLeadId) {
        setDraftsByLeadId((current) => {
          const next = { ...current };
          delete next[completedLeadId];
          return next;
        });
      }

      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Tidak ada lead yang perlu follow up saat ini. Semua lead sedang dalam
        snooze atau sudah ditangani.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[1360px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Lead Name</th>
              <th className="px-4 py-3 font-medium">Assigned Sales</th>
              <th className="px-4 py-3 font-medium">Lead Temperature</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Activity</th>
              <th className="px-4 py-3 font-medium">Days Since Last Follow Up</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Next Action</th>
              <th className="px-4 py-3 font-medium">AI</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.leadId} className="border-b align-top last:border-b-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/leads/${item.leadId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {item.leadName}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.assignedSalesName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getLeadTemperatureBadgeClassName(item.temperature)}`}
                  >
                    {item.temperatureLabel}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize">
                  {formatStatusLabel(item.status)}
                </td>
                <td className="px-4 py-3">
                  <div>{item.lastActivityLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(item.lastActivityAt)}
                  </div>
                </td>
                <td className="px-4 py-3">{item.daysSinceLastFollowUp}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getQueuePriorityBadgeClass(item.priority as QueuePriority)}`}
                  >
                    {item.priorityLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {item.reasons.map((reason) => (
                      <div key={reason.key} className="text-xs">
                        {reason.emoji} {reason.label}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{item.nextAction}</td>
                <td className="px-4 py-3">
                  <QueueAiCell
                    item={item}
                    draft={draftsByLeadId[item.leadId]}
                    onDraftGenerated={handleDraftGenerated}
                    onViewDraft={handleViewDraft}
                  />
                </td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => handleOpenComplete(item)}
                  >
                    Selesai
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalDraft && (
        <GeneratedFollowUpModal
          draft={modalDraft}
          copyFeedback={copyFeedback}
          onClose={handleCloseModal}
          onCopy={handleCopyDraft}
        />
      )}

      {completingItem && (
        <CompleteFollowUpModal
          item={completingItem}
          error={completeError}
          isPending={isCompleting}
          onClose={handleCloseComplete}
          onSubmit={handleCompleteSubmit}
        />
      )}
    </>
  );
}

"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandHelping, Sparkles } from "lucide-react";

import { takeOverWhatsappConversationAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  buildSalesTakeoverSummary,
  formatSalesTakeoverConfidence,
} from "@/modules/inbox/lib/build-sales-takeover-summary";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

type SalesTakeoverSummaryProps = {
  conversation: OmnichannelConversationDetail;
  canTakeOver?: boolean;
  className?: string;
};

type SummaryFieldProps = {
  label: string;
  value: string | null;
};

function SummaryField({ label, value }: SummaryFieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-amber-800/80">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[12px] text-amber-950">{value?.trim() || "—"}</dd>
    </div>
  );
}

export function SalesTakeoverSummary({
  conversation,
  canTakeOver = false,
  className,
}: SalesTakeoverSummaryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isReadyForHuman =
    conversation.channel === "whatsapp" &&
    resolveWhatsappAiState(conversation.aiState) === "READY_FOR_HUMAN";

  const summary = useMemo(
    () =>
      buildSalesTakeoverSummary({
        handoffReason: conversation.aiHandoffReason,
        leadQualification: conversation.leadQualification,
        conversationMemory: conversation.conversationMemory,
        aiActivityEvents: conversation.aiActivityEvents,
        messages: conversation.messages,
      }),
    [conversation],
  );

  if (!isReadyForHuman) {
    return null;
  }

  const confidenceLabel = formatSalesTakeoverConfidence(summary.aiConfidence);

  function handleTakeOver() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversation.id);

      const result = await takeOverWhatsappConversationAction(formData);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <section
      className={cn(
        "border-b border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-amber-50/40 px-5 py-4",
        className,
      )}
      aria-label="Sales takeover summary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200/80">
              Ready for Human
            </span>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-amber-950">
            Sales Takeover Summary
          </h3>
          <p className="mt-1 text-[11px] text-amber-900/80">
            {summary.handoffReason || "Waiting for a human teammate to take over."}
          </p>
        </div>

        {canTakeOver ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleTakeOver}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
          >
            <HandHelping className="h-3.5 w-3.5" />
            {isPending ? "Taking over..." : "Take Over"}
          </button>
        ) : null}
      </div>

      {summary.generatedSummary ? (
        <div className="mt-3 rounded-lg border border-amber-200/70 bg-white/70 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            <Sparkles className="h-3 w-3" />
            AI Summary
          </div>
          <p className="text-[12px] leading-relaxed text-amber-950">
            {summary.generatedSummary}
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-amber-200/80 bg-white/50 px-3 py-2 text-[12px] text-amber-900/80">
          AI belum punya cukup data untuk ringkasan lengkap.
        </p>
      )}

      <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <SummaryField label="Destination" value={summary.destination} />
        <SummaryField label="Departure" value={summary.departure} />
        <SummaryField label="Passenger Count" value={summary.passengerCount} />
        <SummaryField label="Budget" value={summary.budget} />
        <SummaryField label="Trip Type" value={summary.tripType} />
        <SummaryField label="Special Request" value={summary.specialRequest} />
        <SummaryField
          label="Lead Completion Score"
          value={
            summary.completionScore != null ? `${summary.completionScore}%` : null
          }
        />
        <SummaryField label="AI Confidence" value={confidenceLabel} />
      </dl>

      {summary.lastCustomerMessage ? (
        <div className="mt-3 rounded-lg border border-amber-200/60 bg-white/60 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800/80">
            Last Customer Message
          </p>
          <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-amber-950">
            {summary.lastCustomerMessage}
          </p>
        </div>
      ) : null}
    </section>
  );
}

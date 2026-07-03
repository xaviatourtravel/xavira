"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandHelping } from "lucide-react";

import { takeOverWhatsappConversationAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  isQualificationHandoffReason,
  QUALIFICATION_HANDOFF_REASON,
  type LeadQualificationSnapshot,
} from "@/modules/ai/types/lead-qualification";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { cn } from "@/lib/utils";

type WhatsappQualificationHandoffPanelProps = {
  conversationId: string;
  aiState: string | null | undefined;
  aiHandoffReason?: string | null;
  qualification: LeadQualificationSnapshot | null | undefined;
  canManage?: boolean;
  className?: string;
};

export function WhatsappQualificationHandoffPanel({
  conversationId,
  aiState,
  aiHandoffReason,
  qualification,
  canManage = false,
  className,
}: WhatsappQualificationHandoffPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const state = resolveWhatsappAiState(aiState);
  const isQualificationHandoff =
    state === "READY_FOR_HUMAN" && isQualificationHandoffReason(aiHandoffReason);

  if (!isQualificationHandoff || !qualification) {
    return null;
  }

  function handleTakeOver() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);

      const result = await takeOverWhatsappConversationAction(formData);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <section
      className={cn(
        "shrink-0 border-b border-amber-200/80 bg-amber-50/70 px-3 py-3 sm:px-4",
        className,
      )}
      aria-label="Qualification handoff"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200/80">
              Ready for Human
            </span>
            <span className="text-[11px] font-medium text-amber-900">
              {QUALIFICATION_HANDOFF_REASON}
            </span>
          </div>

          <dl className="grid gap-1.5 sm:grid-cols-2">
            {qualification.fieldProgress.map((field) => (
              <div key={field.key} className="min-w-0">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-amber-800/80">
                  {field.label}
                </dt>
                <dd className="truncate text-[12px] text-amber-950">
                  {field.value?.trim() || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {canManage ? (
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
    </section>
  );
}

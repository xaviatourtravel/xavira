"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { takeOverWhatsappConversationAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  isQualificationHandoffReason,
  QUALIFICATION_HANDOFF_REASON,
  type LeadQualificationSnapshot,
} from "@/modules/ai/types/lead-qualification";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
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
  const { ti } = useInboxTranslation();
  const [isPending, startTransition] = useTransition();

  const state = resolveWhatsappAiState(aiState);
  const isQualificationHandoff =
    state === "READY_FOR_HUMAN" && isQualificationHandoffReason(aiHandoffReason);

  if (!isQualificationHandoff || !qualification) {
    return null;
  }

  const capturedFields = qualification.fieldProgress
    .filter((field) => field.value?.trim())
    .map((field) => `${field.label}: ${field.value?.trim()}`)
    .join(" · ");

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
        "shrink-0 bg-amber-500/5 px-4 py-2.5 dark:bg-amber-500/10",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
            {ti("filterReadyForHuman")} · {QUALIFICATION_HANDOFF_REASON}
          </p>
          {capturedFields ? (
            <p className="truncate text-[11px] text-amber-900/80 dark:text-amber-200/80">
              {capturedFields}
            </p>
          ) : null}
        </div>

        {canManage ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleTakeOver}
            className="inline-flex shrink-0 items-center rounded-md bg-amber-800 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-amber-900 disabled:opacity-60 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            {isPending ? ti("working") : ti("nbaCtaTakeOver")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

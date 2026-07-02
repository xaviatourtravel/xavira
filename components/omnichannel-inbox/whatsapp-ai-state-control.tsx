"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

import { updateWhatsappConversationAiStateAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  formatWhatsappAiStateLabel,
  resolveWhatsappAiState,
} from "@/lib/whatsapp-inbox/ai/constants";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<WhatsappAiState, string> = {
  AI_ACTIVE: "bg-sky-50 text-sky-700 ring-sky-200/80",
  READY_FOR_HUMAN: "bg-amber-50 text-amber-700 ring-amber-200/80",
  HUMAN_ASSISTED: "bg-violet-50 text-violet-700 ring-violet-200/80",
  HUMAN_ONLY: "bg-slate-100 text-slate-700 ring-slate-200/80",
};

type WhatsappAiStateControlProps = {
  conversationId: string;
  aiState: string | null | undefined;
  aiHandoffReason?: string | null;
  canManage?: boolean;
};

export function WhatsappAiStateControl({
  conversationId,
  aiState,
  aiHandoffReason,
  canManage = false,
}: WhatsappAiStateControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const state = resolveWhatsappAiState(aiState);
  const label = formatWhatsappAiStateLabel(state);
  const style = STATE_STYLES[state] ?? STATE_STYLES.HUMAN_ONLY;
  const showHandoffReason =
    state === "READY_FOR_HUMAN" && aiHandoffReason?.trim();
  const isAiActive = state === "AI_ACTIVE";

  function runAiStateUpdate(nextState: WhatsappAiState) {
    setNotice(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);
      formData.set("ai_state", nextState);

      const result = await updateWhatsappConversationAiStateAction(formData);

      if (!result.success) {
        setNotice(result.message ?? "Gagal memperbarui status AI.");
        return;
      }

      setNotice(result.message ?? "Status AI diperbarui.");
      router.refresh();
    });
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex max-w-[11rem] shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
            style,
          )}
          title={
            isAiActive
              ? "AI akan membalas pelanggan secara otomatis di chat ini"
              : showHandoffReason
                ? aiHandoffReason ?? label
                : label
          }
        >
          {isAiActive ? <Bot className="h-3 w-3 shrink-0" /> : null}
          <span className="truncate">{label}</span>
        </span>

        {canManage && !isAiActive ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAiStateUpdate("AI_ACTIVE")}
            className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
            title="AI akan membalas pelanggan secara otomatis di chat ini"
          >
            {isPending ? "Menyalakan..." : "Turn on AI"}
          </button>
        ) : null}

        {canManage && isAiActive ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAiStateUpdate("HUMAN_ONLY")}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            title="Matikan balasan otomatis AI untuk chat ini"
          >
            {isPending ? "Mematikan..." : "Turn off AI"}
          </button>
        ) : null}
      </div>

      {showHandoffReason ? (
        <p
          className="max-w-[14rem] truncate text-[10px] text-amber-700"
          title={aiHandoffReason ?? undefined}
        >
          {aiHandoffReason}
        </p>
      ) : null}

      {notice ? (
        <p className="max-w-[14rem] text-[10px] text-muted-foreground">{notice}</p>
      ) : null}
    </div>
  );
}

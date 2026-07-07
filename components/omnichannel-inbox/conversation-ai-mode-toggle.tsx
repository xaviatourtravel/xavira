"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateWhatsappConversationAiStateAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  isWhatsappAiAutoReplyEnabled,
  resolveWhatsappAiState,
} from "@/lib/whatsapp-inbox/ai/constants";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";
import { cn } from "@/lib/utils";

type ConversationAiMode = "ai_active" | "manual";

type ConversationAiModeToggleProps = {
  conversationId: string;
  aiState: string | null | undefined;
  canManage?: boolean;
};

function resolveToggleMode(aiState: string | null | undefined): ConversationAiMode {
  return isWhatsappAiAutoReplyEnabled(resolveWhatsappAiState(aiState))
    ? "ai_active"
    : "manual";
}

function modeToAiState(mode: ConversationAiMode): WhatsappAiState {
  return mode === "ai_active" ? "AI_ACTIVE" : "HUMAN_ONLY";
}

export function ConversationAiModeToggle({
  conversationId,
  aiState,
  canManage = false,
}: ConversationAiModeToggleProps) {
  const router = useRouter();
  const { ti } = useInboxTranslation();
  const [isPending, startTransition] = useTransition();

  const activeMode = resolveToggleMode(aiState);
  const isDisabled = !canManage || isPending;

  function handleSelect(mode: ConversationAiMode) {
    if (isDisabled || mode === activeMode) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);
      formData.set("ai_state", modeToAiState(mode));

      const result = await updateWhatsappConversationAiStateAction(formData);

      if (!result.success) {
        logInboxError("updateAiState", result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="shrink-0">
      <div
        role="radiogroup"
        aria-label={ti("aiMode")}
        aria-disabled={isDisabled}
        className={cn(
          "inline-flex items-center rounded-lg border border-border/50 bg-muted/25 p-0.5",
          isDisabled && "opacity-60",
        )}
      >
        {(
          [
            { mode: "ai_active" as const, label: ti("aiModeToggleAiActive") },
            { mode: "manual" as const, label: ti("aiModeToggleManual") },
          ] as const
        ).map((option) => {
          const active = activeMode === option.mode;

          return (
            <button
              key={option.mode}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={isDisabled}
              onClick={() => handleSelect(option.mode)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-200",
                active
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
                  : "text-muted-foreground hover:text-foreground",
                isDisabled && "cursor-not-allowed",
              )}
            >
              {isPending && active ? ti("aiSavingLabel") : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

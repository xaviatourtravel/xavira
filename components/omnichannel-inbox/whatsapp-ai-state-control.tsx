"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, ChevronDown } from "lucide-react";

import { updateWhatsappConversationAiStateAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  formatWhatsappAiStateLabel,
  getWhatsappAiStateDescription,
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

type ManualAiAction = {
  id: "turn_on" | "turn_off" | "human_assisted";
  label: string;
  nextState: WhatsappAiState;
  description: string;
};

const MANUAL_AI_ACTIONS: ManualAiAction[] = [
  {
    id: "turn_on",
    label: "Turn on AI",
    nextState: "AI_ACTIVE",
    description: "AI will auto-reply in this chat.",
  },
  {
    id: "turn_off",
    label: "Turn off AI",
    nextState: "HUMAN_ONLY",
    description: "AI will not reply automatically.",
  },
  {
    id: "human_assisted",
    label: "Mark Human Assisted",
    nextState: "HUMAN_ASSISTED",
    description: "AI can suggest, but will not auto-reply.",
  },
];

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
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const state = resolveWhatsappAiState(aiState);
  const label = formatWhatsappAiStateLabel(state);
  const description = getWhatsappAiStateDescription(state, aiHandoffReason);
  const style = STATE_STYLES[state] ?? STATE_STYLES.HUMAN_ONLY;
  const isAiActive = state === "AI_ACTIVE";

  const availableActions = MANUAL_AI_ACTIONS.filter(
    (action) => action.nextState !== state,
  );

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function runAiStateUpdate(nextState: WhatsappAiState) {
    setNotice(null);
    setMenuOpen(false);

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
    <div ref={menuRef} className="relative flex min-w-0 flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex max-w-[11rem] shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
            style,
          )}
          title={description}
        >
          {isAiActive ? <Bot className="h-3 w-3 shrink-0" /> : null}
          <span className="truncate">{label}</span>
        </span>

        {canManage && availableActions.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {isPending ? "Saving..." : "Manage"}
              <ChevronDown className="h-3 w-3" />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+0.35rem)] z-50 min-w-[13rem] rounded-lg border bg-background p-1 shadow-lg"
              >
                {availableActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    role="menuitem"
                    disabled={isPending}
                    onClick={() => runAiStateUpdate(action.nextState)}
                    className="flex w-full flex-col items-start rounded-md px-2.5 py-2 text-left hover:bg-muted/60 disabled:opacity-60"
                  >
                    <span className="text-[11px] font-semibold text-foreground">
                      {action.label}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <p
        className={cn(
          "max-w-[16rem] text-[10px] leading-snug",
          state === "READY_FOR_HUMAN" ? "text-amber-700" : "text-muted-foreground",
        )}
        title={description}
      >
        {description}
      </p>

      {notice ? (
        <p className="max-w-[16rem] text-[10px] text-muted-foreground">{notice}</p>
      ) : null}
    </div>
  );
}

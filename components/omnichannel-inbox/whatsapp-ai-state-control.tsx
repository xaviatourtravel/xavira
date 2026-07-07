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
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<WhatsappAiState, string> = {
  AI_ACTIVE: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300 dark:ring-sky-500/30",
  READY_FOR_HUMAN: "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30",
  HUMAN_ASSISTED: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300 dark:ring-violet-500/30",
  HUMAN_ONLY: "bg-muted/60 text-foreground ring-border/40 dark:bg-muted/40",
};

type ManualAiAction = {
  id: "turn_on" | "turn_off" | "human_assisted";
  labelKey: InboxKey;
  nextState: WhatsappAiState;
  descriptionKey: InboxKey;
};

const MANUAL_AI_ACTIONS: ManualAiAction[] = [
  {
    id: "turn_on",
    labelKey: "aiActionTurnOn",
    nextState: "AI_ACTIVE",
    descriptionKey: "aiActionTurnOnDesc",
  },
  {
    id: "turn_off",
    labelKey: "aiActionTurnOff",
    nextState: "HUMAN_ONLY",
    descriptionKey: "aiActionTurnOffDesc",
  },
  {
    id: "human_assisted",
    labelKey: "aiActionHumanAssisted",
    nextState: "HUMAN_ASSISTED",
    descriptionKey: "aiActionHumanAssistedDesc",
  },
];

type WhatsappAiStateControlProps = {
  conversationId: string;
  aiState: string | null | undefined;
  aiHandoffReason?: string | null;
  canManage?: boolean;
  compact?: boolean;
};

export function WhatsappAiStateControl({
  conversationId,
  aiState,
  aiHandoffReason,
  canManage = false,
  compact = false,
}: WhatsappAiStateControlProps) {
  const router = useRouter();
  const { ti } = useInboxTranslation();
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
        logInboxError("updateAiState", result.message);
        setNotice(ti("failedUpdateAiState"));
        return;
      }

      setNotice(ti("aiModeUpdatedSuccess"));
      router.refresh();
    });
  }

  return (
    <div ref={menuRef} className="relative flex min-w-0 items-center">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex max-w-[11rem] shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
            style,
          )}
          title={description}
        >
          {isAiActive && !compact ? <Bot className="h-3 w-3 shrink-0" /> : null}
          <span className="truncate">{label}</span>
        </span>

        {canManage && availableActions.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-60 dark:hover:bg-muted/40"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {isPending ? ti("aiSavingLabel") : ti("aiManageLabel")}
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
                    <span className="text-[11px] font-medium text-foreground">
                      {ti(action.labelKey)}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                      {ti(action.descriptionKey)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {!compact && notice ? (
        <p className="mt-1 max-w-[16rem] text-[10px] text-muted-foreground">{notice}</p>
      ) : null}
    </div>
  );
}

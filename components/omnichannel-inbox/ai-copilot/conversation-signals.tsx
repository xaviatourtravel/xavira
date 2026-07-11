"use client";

import { CheckCircle } from "lucide-react";

import {
  AURORA_COPILOT_CARD,
  AURORA_COPILOT_CARD_TITLE,
  AURORA_COPILOT_CHIP,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { resolveCopilotIcon } from "./copilot-icons";
import type { AICopilotLabels, AICopilotSignal } from "./types";

type ConversationSignalsProps = {
  signals: AICopilotSignal[];
  labels: Pick<AICopilotLabels, "signalsTitle">;
  className?: string;
};

export function ConversationSignals({ signals, labels, className }: ConversationSignalsProps) {
  return (
    <article className={cn(AURORA_COPILOT_CARD, className)}>
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
        <h4 className={AURORA_COPILOT_CARD_TITLE}>{labels.signalsTitle}</h4>
      </div>

      <ul className="flex flex-wrap gap-2">
        {signals.map((signal) => {
          const Icon = signal.icon ? resolveCopilotIcon(signal.icon) : CheckCircle;

          return (
            <li key={signal.id}>
              <span className={AURORA_COPILOT_CHIP}>
                <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden />
                {signal.label}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

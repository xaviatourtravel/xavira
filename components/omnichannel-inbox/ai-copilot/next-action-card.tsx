"use client";

import { Target } from "lucide-react";

import {
  AURORA_COPILOT_ACTION_ICON,
  AURORA_COPILOT_ACTION_ROW,
  AURORA_COPILOT_ACTION_ROW_RECOMMENDED,
  AURORA_COPILOT_CARD,
  AURORA_COPILOT_CARD_TITLE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { resolveCopilotIcon } from "./copilot-icons";
import type { AICopilotLabels, AICopilotNextAction } from "./types";

type NextActionCardProps = {
  actions: AICopilotNextAction[];
  labels: Pick<AICopilotLabels, "nextActionTitle" | "recommended">;
  className?: string;
};

export function NextActionCard({ actions, labels, className }: NextActionCardProps) {
  return (
    <article className={cn(AURORA_COPILOT_CARD, className)}>
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
        <h4 className={AURORA_COPILOT_CARD_TITLE}>{labels.nextActionTitle}</h4>
      </div>

      <ul className="flex flex-col gap-1">
        {actions.map((action) => {
          const Icon = resolveCopilotIcon(action.icon);

          return (
            <li key={action.id}>
              <div
                className={
                  action.recommended
                    ? AURORA_COPILOT_ACTION_ROW_RECOMMENDED
                    : AURORA_COPILOT_ACTION_ROW
                }
              >
                <span className={AURORA_COPILOT_ACTION_ICON} aria-hidden>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {action.title}
                    </span>
                    {action.recommended ? (
                      <span className="rounded-full bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {labels.recommended}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

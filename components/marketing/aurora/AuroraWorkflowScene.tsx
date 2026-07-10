import { Bot, CheckCircle2, MessageSquare, Sparkles, UserRound } from "lucide-react";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { cn } from "@/lib/utils";

type AuroraStep = {
  title: string;
  description: string;
};

const STEP_ICONS = [MessageSquare, Sparkles, Bot, UserRound, CheckCircle2] as const;

export function AuroraWorkflowScene({
  steps,
  className,
}: {
  steps: readonly AuroraStep[];
  className?: string;
}) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[2rem] marketing-dark-band-glow opacity-60 blur-3xl sm:-inset-6"
      />

      <div
        className={cn(
          marketingColorClasses.sceneFrame,
          "relative min-h-[480px] p-5 sm:p-6 lg:min-h-[540px] lg:p-8",
        )}
        aria-label="Aurora AI workflow sequence"
      >
        <ol className="relative z-[1] grid gap-4 lg:grid-cols-5 lg:gap-3">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? Bot;
            const isAiStep = index === 1 || index === 2;
            const isHumanStep = index >= 3;

            return (
              <li
                key={step.title}
                className={cn(
                  "marketing-scene-panel flex flex-col p-4 sm:p-5",
                  isAiStep && "ring-1 ring-[var(--marketing-border-accent)]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--marketing-foreground)] text-xs font-semibold text-[var(--marketing-background)]">
                    {index + 1}
                  </span>
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isAiStep
                        ? "text-[var(--marketing-accent)]"
                        : "text-[var(--marketing-muted)]",
                    )}
                    aria-hidden
                  />
                </div>

                <p className="mt-4 text-sm font-semibold text-[var(--marketing-foreground)] sm:text-base">
                  {step.title}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--marketing-muted)]">
                  {step.description}
                </p>

                {index === 2 ? (
                  <div className="mt-4 rounded-lg bg-[var(--marketing-surface)] p-3 text-xs text-[var(--marketing-muted)]">
                    Draft reply prepared · not sent automatically
                  </div>
                ) : null}

                {isHumanStep && index === steps.length - 1 ? (
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--marketing-primary)]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Human approval required
                  </div>
                ) : null}

                {index < steps.length - 1 ? (
                  <span
                    className="mt-4 hidden text-center text-[var(--marketing-border-strong)] lg:block"
                    aria-hidden
                  >
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

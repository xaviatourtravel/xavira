import {
  BarChart3,
  Bot,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  Users,
  Workflow,
} from "lucide-react";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "communication", label: "Communication", icon: MessageSquare, angle: -90 },
  { id: "crm", label: "CRM", icon: Users, angle: -35 },
  { id: "operations", label: "Operations", icon: LayoutGrid, angle: 15 },
  { id: "finance", label: "Finance", icon: CreditCard, angle: 65 },
  { id: "automation", label: "Automation", icon: Workflow, angle: 115 },
  { id: "aurora", label: "Aurora AI", icon: Bot, angle: 165 },
  { id: "analytics", label: "Analytics", icon: BarChart3, angle: 210 },
] as const;

function polarPosition(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: `calc(50% + ${Math.cos(rad) * radius}px)`,
    top: `calc(50% + ${Math.sin(rad) * radius}px)`,
  };
}

export function PlatformCoreComposition({
  modules,
  className,
}: {
  modules: readonly string[];
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-5xl", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70"
      >
        <div className="h-72 w-72 rounded-full marketing-dark-band-glow blur-2xl sm:h-96 sm:w-96" />
      </div>

      <div
        className={cn(
          marketingColorClasses.sceneFrame,
          "relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]",
        )}
        aria-label="Connected Desklabs platform modules"
      >
        <div className="relative z-[1] h-full p-6 sm:p-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-full w-full text-[var(--marketing-border-accent)]"
              viewBox="0 0 400 400"
              aria-hidden
            >
              {MODULES.map((module) => (
                  <line
                    key={module.id}
                    x1="200"
                    y1="200"
                    x2={200 + Math.cos((module.angle * Math.PI) / 180) * 150}
                    y2={200 + Math.sin((module.angle * Math.PI) / 180) * 150}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                ))}
            </svg>
          </div>

          <div className="absolute left-1/2 top-1/2 z-[2] w-[min(100%,240px)] -translate-x-1/2 -translate-y-1/2">
            <div className="marketing-scene-panel p-5 text-center shadow-[var(--marketing-shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--marketing-muted-foreground)]">
                Shared context
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--marketing-foreground)]">
                Sarah Wijaya
              </p>
              <p className="mt-2 text-sm text-[var(--marketing-muted)]">
                Conversation, pipeline, operations, and finance in one workspace.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--marketing-muted)]">
                <div className="rounded-md bg-[var(--marketing-surface)] px-2 py-1.5">Inbox open</div>
                <div className="rounded-md bg-[var(--marketing-surface)] px-2 py-1.5">Proposal stage</div>
              </div>
            </div>
          </div>

          {MODULES.map((module, index) => {
            const Icon = module.icon;
            const pos = polarPosition(module.angle, 148);
            const label = modules[index] ?? module.label;

            return (
              <div
                key={module.id}
                className="absolute z-[2] -translate-x-1/2 -translate-y-1/2"
                style={pos}
              >
                <div className="marketing-scene-panel flex min-w-[120px] items-center gap-2 px-3 py-2.5 sm:min-w-[140px] sm:px-4 sm:py-3">
                  <Icon className="h-4 w-4 shrink-0 text-[var(--marketing-primary)]" aria-hidden />
                  <span className="text-xs font-semibold text-[var(--marketing-foreground)] sm:text-sm">
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

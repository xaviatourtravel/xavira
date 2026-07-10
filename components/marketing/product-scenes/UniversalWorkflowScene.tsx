"use client";

import { SceneConnector } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneTimelineItem } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneStyles, SCENE_CUSTOMER } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function UniversalWorkflowScene({
  steps,
  className,
  activeIndex = 2,
}: {
  steps: readonly string[];
  className?: string;
  activeIndex?: number;
}) {
  const locale = useSceneLocale();

  const contextEvents =
    locale === "id"
      ? [
          { label: "Percakapan dimulai", active: activeIndex >= 0 },
          { label: "Qualified & quoted", active: activeIndex >= 2 },
          { label: "Operasi berjalan", active: activeIndex >= 3 },
          { label: "Pembayaran & delivery", active: activeIndex >= 5, last: true },
        ]
      : [
          { label: "Conversation started", active: activeIndex >= 0 },
          { label: "Qualified & quoted", active: activeIndex >= 2 },
          { label: "Operation in progress", active: activeIndex >= 3 },
          { label: "Payment & delivery", active: activeIndex >= 5, last: true },
        ];

  return (
    <SceneWindow className={className} label="Universal customer workflow" glow={false}>
      <div className={cn(sceneStyles.canvas, "m-2 p-3 sm:m-3 sm:p-4")}>
        <div className="hidden items-stretch gap-1.5 lg:flex">
          {steps.map((step, index) => (
            <div key={step} className="flex min-w-0 flex-1 items-center gap-1.5">
              <div
                className={cn(
                  "flex min-h-[72px] flex-1 items-center justify-center px-2 py-3 text-center",
                  index === activeIndex
                    ? sceneStyles.activeSurface
                    : index < activeIndex
                      ? sceneStyles.selectedSurface
                      : sceneStyles.mutedSurface,
                )}
              >
                <p className={cn(sceneStyles.label, "font-semibold leading-snug")}>{step}</p>
              </div>
              {index < steps.length - 1 ? (
                <SceneConnector direction="horizontal" className="text-[var(--marketing-primary)] opacity-60" />
              ) : null}
            </div>
          ))}
        </div>

        <ol className="space-y-0 lg:hidden">
          {steps.map((step, index) => (
            <li key={step}>
              <div
                className={cn(
                  "flex min-h-[48px] items-center gap-2 px-3 py-2.5",
                  index === activeIndex
                    ? sceneStyles.activeSurface
                    : index < activeIndex
                      ? sceneStyles.selectedSurface
                      : sceneStyles.mutedSurface,
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    index === activeIndex
                      ? "bg-[var(--marketing-primary)] text-[var(--marketing-primary-foreground)]"
                      : "bg-[var(--marketing-foreground)] text-[var(--marketing-background)]",
                  )}
                >
                  {index + 1}
                </span>
                <p className={cn(sceneStyles.label, "font-semibold")}>{step}</p>
              </div>
              {index < steps.length - 1 ? (
                <SceneConnector direction="vertical" className="ml-3 text-[var(--marketing-primary)] opacity-60" />
              ) : null}
            </li>
          ))}
        </ol>

        <ScenePanel
          padding="compact"
          className={cn(sceneStyles.primarySurface, "mt-4")}
          title={locale === "id" ? "Konteks pelanggan" : "Customer context"}
        >
          <p className={cn(sceneStyles.name, "mb-2 text-sm")}>{SCENE_CUSTOMER}</p>
          <ol className="grid gap-0 sm:grid-cols-2">
            {contextEvents.map((event, index) => (
              <SceneTimelineItem
                key={event.label}
                label={event.label}
                active={event.active}
                last={index === contextEvents.length - 1}
              />
            ))}
          </ol>
        </ScenePanel>
      </div>
    </SceneWindow>
  );
}

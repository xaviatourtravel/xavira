"use client";

import { SceneAvatar } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneTimelineItem } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneStyles, SCENE_CUSTOMER } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function CustomerTimelineScene({ className, compact }: { className?: string; compact?: boolean }) {
  const locale = useSceneLocale();

  const events =
    locale === "id"
      ? [
          { label: "Inquiry via WhatsApp", meta: "Channel preserved", active: false },
          { label: "Qualified by sales", meta: "Stage updated", active: false },
          { label: "Proposal shared", meta: "Awaiting response", active: true },
          { label: "Follow-up task created", meta: "Owner assigned", active: false, last: true },
        ]
      : [
          { label: "Inquiry via WhatsApp", meta: "Channel preserved", active: false },
          { label: "Qualified by sales", meta: "Stage updated", active: false },
          { label: "Proposal shared", meta: "Awaiting response", active: true },
          { label: "Follow-up task created", meta: "Owner assigned", active: false, last: true },
        ];

  return (
    <SceneWindow className={className} label="Customer timeline">
      <div className={cn(sceneStyles.canvas, "m-2 p-3 sm:m-3 sm:p-4", compact && "p-2.5")}>
        <div className="flex items-center gap-3 border-b border-[var(--marketing-border-default)] pb-3">
          <SceneAvatar name={SCENE_CUSTOMER} />
          <div className="min-w-0 flex-1">
            <p className={cn(sceneStyles.name, "text-sm")}>{SCENE_CUSTOMER}</p>
            <p className={sceneStyles.meta}>{locale === "id" ? "Timeline pelanggan" : "Customer timeline"}</p>
          </div>
          <SceneBadge tone="primary">{locale === "id" ? "High intent" : "High intent"}</SceneBadge>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <ScenePanel padding="compact" className={sceneStyles.primarySurface}>
            <ol>
              {events.map((event, index) => (
                <SceneTimelineItem
                  key={event.label}
                  label={event.label}
                  meta={event.meta}
                  active={event.active}
                  last={index === events.length - 1}
                />
              ))}
            </ol>
          </ScenePanel>

          <div className="space-y-2">
            <ScenePanel padding="compact" className={sceneStyles.activeSurface} title={locale === "id" ? "Stage saat ini" : "Current stage"}>
              <p className={cn(sceneStyles.name, "text-[var(--marketing-primary-muted-foreground)]")}>Proposal</p>
              <p className={sceneStyles.meta}>{locale === "id" ? "Menunggu respons pelanggan" : "Awaiting customer response"}</p>
            </ScenePanel>
            <ScenePanel padding="compact" className={sceneStyles.secondarySurface} title={locale === "id" ? "Next action" : "Next action"}>
              <p className={sceneStyles.label}>{locale === "id" ? "Call scheduled · Thu 10:00" : "Call scheduled · Thu 10:00"}</p>
            </ScenePanel>
          </div>
        </div>
      </div>
    </SceneWindow>
  );
}

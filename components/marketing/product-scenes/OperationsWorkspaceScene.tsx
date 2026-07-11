"use client";

import { SceneMotionLayer } from "@/components/marketing/motion/SceneMotionLayer";
import { SceneAvatar, SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneStyles, SCENE_CUSTOMER } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

const OPS_COLUMNS: Array<{ title: string; status: string; progress: number; active?: boolean }> = [
  { title: "Booking", status: "Confirmed", progress: 100 },
  { title: "Task", status: "In progress", progress: 68, active: true },
  { title: "Document", status: "Pending review", progress: 40 },
];

export function OperationsWorkspaceScene({ className, compact, dark }: { className?: string; compact?: boolean; dark?: boolean }) {
  const locale = useSceneLocale();
  const textClass = dark ? "text-[var(--marketing-background)]" : sceneStyles.name;
  const labelClass = dark ? "text-[color-mix(in_srgb,var(--marketing-background)_72%,transparent)]" : sceneStyles.label;
  const surface = dark ? sceneStyles.darkSurface : sceneStyles.secondarySurface;
  const activeSurface = dark ? sceneStyles.darkSurface : sceneStyles.activeSurface;

  const summary = [
    { title: locale === "id" ? "Pipeline" : "Pipeline", value: "Proposal" },
    { title: locale === "id" ? "Owner" : "Owner", value: "Sales team" },
    { title: locale === "id" ? "Payment" : "Payment", value: locale === "id" ? "Pending review" : "Pending review" },
  ];

  return (
    <SceneWindow className={className} label="Operations workspace" glow={!dark}>
      <div className={cn(sceneStyles.canvas, "m-2 p-3 sm:m-3 sm:p-4", compact && "p-2.5", dark && "border-0 bg-transparent")}>
        <SceneMotionLayer delay={0}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SceneAvatar name={SCENE_CUSTOMER} size="sm" />
              <div>
                <p className={cn(textClass, "text-sm")}>{SCENE_CUSTOMER}</p>
                <p className={labelClass}>{locale === "id" ? "Operasi terhubung" : "Connected operation"}</p>
              </div>
            </div>
            <SceneBadge tone="warning">{locale === "id" ? "In progress" : "In progress"}</SceneBadge>
          </div>
        </SceneMotionLayer>

        <div className="grid gap-2 sm:grid-cols-3">
          {summary.map((item, index) => (
            <SceneMotionLayer key={item.title} delay={120 + index * 80}>
              <div className={cn(surface, "px-2.5 py-2")}>
                <p className={labelClass}>{item.title}</p>
                <p className={cn(textClass, "mt-0.5 text-sm")}>{item.value}</p>
              </div>
            </SceneMotionLayer>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {OPS_COLUMNS.map((column, index) => (
            <SceneMotionLayer key={column.title} delay={360 + index * 100}>
              <ScenePanel
                padding="compact"
                title={column.title}
                className={column.active ? activeSurface : surface}
              >
                <p className={cn(labelClass, "font-medium")}>{column.status}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--marketing-border-default)]">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      column.active ? "bg-[var(--marketing-primary)]" : "bg-[var(--marketing-border-strong)]",
                    )}
                    style={{ width: `${column.progress}%` }}
                  />
                </div>
              </ScenePanel>
            </SceneMotionLayer>
          ))}
        </div>

        <SceneMotionLayer delay={680}>
          <p className={cn(labelClass, "mt-3")}>
            {locale === "id" ? "Tim melihat status yang sama" : "Team sees the same status"}
          </p>
        </SceneMotionLayer>
      </div>
    </SceneWindow>
  );
}

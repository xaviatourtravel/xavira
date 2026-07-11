"use client";

import { SceneMotionLayer } from "@/components/marketing/motion/SceneMotionLayer";
import { SceneAvatar } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneStyles, SCENE_CUSTOMER } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function UnifiedInboxScene({ className, compact }: { className?: string; compact?: boolean }) {
  const locale = useSceneLocale();

  const rows = [
    { channel: "whatsapp" as const, name: SCENE_CUSTOMER, preview: locale === "id" ? "Konsultasi paket growth" : "Growth plan inquiry", active: true },
    { channel: "instagram" as const, name: "Reza Pratama", preview: locale === "id" ? "Follow-up quotation" : "Follow-up quotation", active: false },
    { channel: "email" as const, name: "Northline Studio", preview: locale === "id" ? "Proposal revision" : "Proposal revision", active: false },
  ];

  return (
    <SceneWindow className={className} label="Unified inbox">
      <div className={cn(sceneStyles.canvas, "m-2 p-3 sm:m-3 sm:p-4", compact && "p-2.5")}>
        <p className={cn(sceneStyles.title, "mb-3")}>{locale === "id" ? "Inbox terpadu" : "Unified inbox"}</p>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <SceneMotionLayer delay={120} className={cn(sceneStyles.secondarySurface, "space-y-1 p-1.5")}>
            {rows.map((row, index) => (
              <SceneMotionLayer key={row.name} delay={180 + index * 80}>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--marketing-radius-sm)] px-2 py-2",
                    row.active ? sceneStyles.selectedSurface : sceneStyles.mutedSurface,
                    !row.active && "opacity-75",
                  )}
                >
                  <SceneAvatar name={row.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className={cn(sceneStyles.name, row.active && "text-[var(--marketing-primary-muted-foreground)]")}>
                      {row.name}
                    </p>
                    <p className={cn(sceneStyles.label, "truncate")}>{row.preview}</p>
                  </div>
                  {!row.active ? (
                    <SceneBadge tone={`channel-${row.channel}`}>
                      {row.channel === "whatsapp" ? "WA" : row.channel === "instagram" ? "IG" : "Email"}
                    </SceneBadge>
                  ) : null}
                </div>
              </SceneMotionLayer>
            ))}
          </SceneMotionLayer>

          <SceneMotionLayer delay={360}>
            <ScenePanel padding="compact" className={sceneStyles.activeSurface}>
              <div className="mb-2 flex items-center gap-2">
                <SceneAvatar name={SCENE_CUSTOMER} />
                <div>
                  <p className={cn(sceneStyles.name, "text-sm")}>{SCENE_CUSTOMER}</p>
                  <p className={sceneStyles.meta}>{locale === "id" ? "Satu identitas pelanggan" : "One customer identity"}</p>
                </div>
              </div>
              <div className={cn(sceneStyles.bubbleIn, "px-3 py-2.5")}>
                <p className={sceneStyles.body}>
                  {locale === "id"
                    ? "Apakah proposal bisa dikirim hari ini?"
                    : "Can the proposal be sent today?"}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <SceneBadge tone="channel-whatsapp">WhatsApp</SceneBadge>
                <SceneBadge tone="primary">{locale === "id" ? "Assigned · Sales" : "Assigned · Sales"}</SceneBadge>
              </div>
            </ScenePanel>
          </SceneMotionLayer>
        </div>
      </div>
    </SceneWindow>
  );
}

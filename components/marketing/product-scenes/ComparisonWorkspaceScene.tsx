"use client";

import { Bot, MessageSquare, Sparkles, StickyNote, Table } from "lucide-react";

import { SceneMotionLayer } from "@/components/marketing/motion/SceneMotionLayer";
import { SceneAvatar } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneCopy } from "@/components/marketing/product-scenes/scene-copy";
import { sceneStyles, SCENE_CUSTOMER } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function ComparisonWorkspaceScene({ className }: { className?: string }) {
  const locale = useSceneLocale();
  const copy = sceneCopy(locale);

  const fragments = [
    { icon: MessageSquare, label: "WA · Thread A", delay: 120 },
    { icon: Table, label: locale === "id" ? "Spreadsheet" : "Spreadsheet", delay: 200 },
    { icon: StickyNote, label: locale === "id" ? "Catatan manual" : "Manual notes", delay: 280 },
  ];

  return (
    <SceneWindow className={className} label="Before and after workspace comparison">
      <div className={cn(sceneStyles.canvas, "m-2 grid gap-3 p-3 sm:m-3 sm:grid-cols-2 sm:items-stretch sm:p-4")}>
        <SceneMotionLayer delay={0}>
          <ScenePanel padding="compact" title={copy.comparison.disconnected} className={sceneStyles.secondarySurface}>
            <div className="grid gap-2 sm:grid-cols-2">
              {fragments.map(({ icon: Icon, label, delay }) => (
                <SceneMotionLayer key={label} delay={delay}>
                  <div className={cn(sceneStyles.mutedSurface, "p-2 opacity-80")}>
                    <Icon className="h-3.5 w-3.5 text-[var(--marketing-muted)]" aria-hidden />
                    <p className={cn(sceneStyles.label, "mt-1")}>{label}</p>
                  </div>
                </SceneMotionLayer>
              ))}
              <SceneMotionLayer delay={360}>
                <div className={cn(sceneStyles.mutedSurface, "border border-dashed border-[var(--marketing-border-strong)] p-2 opacity-70")}>
                  <p className={sceneStyles.meta}>{locale === "id" ? "Identitas duplikat" : "Duplicated identity"}</p>
                  <p className={sceneStyles.label}>Nadia / N. Putri</p>
                </div>
              </SceneMotionLayer>
            </div>
            <p className={cn(sceneStyles.meta, "mt-2")}>
              {locale === "id" ? "Reminder terpisah · data disalin manual" : "Separate reminders · manual copy-paste"}
            </p>
          </ScenePanel>
        </SceneMotionLayer>

        <SceneMotionLayer delay={200}>
          <ScenePanel padding="compact" title={copy.comparison.desklabs} className={sceneStyles.activeSurface}>
            <SceneMotionLayer delay={320}>
              <div className="flex items-center gap-2">
                <SceneAvatar name={SCENE_CUSTOMER} size="sm" />
                <div>
                  <p className={sceneStyles.name}>{SCENE_CUSTOMER}</p>
                  <p className={sceneStyles.meta}>{locale === "id" ? "Identitas unified" : "Unified identity"}</p>
                </div>
              </div>
            </SceneMotionLayer>
            <SceneMotionLayer delay={440}>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <SceneBadge tone="channel-whatsapp">Inbox</SceneBadge>
                <SceneBadge tone="primary">{locale === "id" ? "Operasi" : "Operations"}</SceneBadge>
              </div>
            </SceneMotionLayer>
            <SceneMotionLayer delay={560}>
              <div className={cn(sceneStyles.accentSurface, "mt-2 flex items-start gap-1.5 p-2")}>
                <Sparkles className="h-3.5 w-3.5 text-[var(--marketing-accent)]" aria-hidden />
                <Bot className="h-3.5 w-3.5 text-[var(--marketing-accent-secondary)]" aria-hidden />
                <p className={sceneStyles.label}>
                  {locale === "id" ? "Aurora · follow-up suggested" : "Aurora · follow-up suggested"}
                </p>
              </div>
            </SceneMotionLayer>
            <SceneMotionLayer delay={680}>
              <p className={cn(sceneStyles.meta, "mt-2 font-medium text-[var(--marketing-primary-muted-foreground)]")}>
                {locale === "id" ? "Next action visible to team" : "Next action visible to team"}
              </p>
            </SceneMotionLayer>
          </ScenePanel>
        </SceneMotionLayer>
      </div>
    </SceneWindow>
  );
}

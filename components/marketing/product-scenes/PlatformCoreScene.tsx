"use client";

import {
  BarChart3,
  Bot,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  Users,
  Workflow,
} from "lucide-react";
import { m } from "framer-motion";
import { useEffect, useState } from "react";

import { SceneMotionLayer } from "@/components/marketing/motion/SceneMotionLayer";
import { motionTransition } from "@/components/marketing/motion/motion-variants";
import { useMotionScene } from "@/components/marketing/motion/motion-scene-context";
import { marketingMotionDurations } from "@/components/marketing/motion/motion-tokens";
import { SceneAvatar } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneTimelineItem } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneStyles, SCENE_CUSTOMER } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "communication", icon: MessageSquare, col: "1 / 2", row: "1", delay: 240 },
  { id: "crm", icon: Users, col: "2 / 3", row: "1", delay: 300 },
  { id: "operations", icon: LayoutGrid, col: "4 / 5", row: "1", delay: 380 },
  { id: "finance", icon: CreditCard, col: "5 / 6", row: "1", delay: 420 },
  { id: "automation", icon: Workflow, col: "1 / 2", row: "2", delay: 500 },
  { id: "aurora", icon: Bot, col: "2 / 3", row: "2", delay: 540 },
  { id: "analytics", icon: BarChart3, col: "5 / 6", row: "2", delay: 600 },
] as const;

function ConnectorLines() {
  const { active, reducedMotion } = useMotionScene();
  const [draw, setDraw] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setDraw(true);
      return;
    }
    if (active) {
      setDraw(true);
    }
  }, [active, reducedMotion]);

  const lines = (
    <>
      <line x1="50%" y1="28%" x2="20%" y2="18%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="50%" y1="28%" x2="36%" y2="18%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="50%" y1="28%" x2="64%" y2="18%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="50%" y1="28%" x2="80%" y2="18%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="50%" y1="28%" x2="50%" y2="72%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
    </>
  );

  if (reducedMotion || !draw) {
    return (
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full text-[var(--marketing-border-accent)] opacity-60 md:block"
        aria-hidden
      >
        {lines}
      </svg>
    );
  }

  return (
    <m.svg
      className="pointer-events-none absolute inset-0 hidden h-full w-full text-[var(--marketing-border-accent)] md:block"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={motionTransition(marketingMotionDurations.reveal, 900)}
    >
      {lines}
    </m.svg>
  );
}

export function PlatformCoreScene({
  modules,
  className,
}: {
  modules: readonly string[];
  className?: string;
}) {
  const locale = useSceneLocale();

  const timeline =
    locale === "id"
      ? [
          { label: "Percakapan masuk", active: false },
          { label: "Stage diperbarui", active: false },
          { label: "Operasi dibuat", active: true },
          { label: "Invoice disiapkan", active: false, last: true },
        ]
      : [
          { label: "Conversation received", active: false },
          { label: "Stage updated", active: false },
          { label: "Operation created", active: true },
          { label: "Invoice prepared", active: false, last: true },
        ];

  const moduleLabels: Record<string, string> = {
    communication: modules[0] ?? "Communication",
    crm: modules[1] ?? "CRM",
    operations: modules[2] ?? "Operations",
    finance: modules[3] ?? "Finance",
    automation: modules[4] ?? "Automation",
    aurora: modules[5] ?? "Aurora AI",
    analytics: modules[6] ?? "Analytics",
  };

  return (
    <SceneWindow className={className} label="Connected Desklabs platform" decorative={false}>
      <div className={cn(sceneStyles.canvas, "relative m-2 p-3 sm:m-3 sm:p-4")}>
        <div className="relative grid min-h-[360px] grid-cols-2 gap-2 sm:min-h-[400px] md:grid-cols-5 md:grid-rows-[1fr_auto] md:gap-3">
          <ConnectorLines />

          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <SceneMotionLayer
                key={module.id}
                delay={module.delay}
                className={cn(
                  sceneStyles.secondarySurface,
                  "relative z-[1] flex items-center gap-1.5 px-2.5 py-2.5 md:flex-col md:justify-center md:px-2 md:py-3 md:text-center",
                  module.id === "aurora" && sceneStyles.accentSurface,
                )}
                style={{ gridColumn: module.col, gridRow: module.row }}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    module.id === "aurora"
                      ? "text-[var(--marketing-accent)]"
                      : "text-[var(--marketing-primary)]",
                  )}
                  aria-hidden
                />
                <p className={cn(sceneStyles.label, "leading-tight")}>{moduleLabels[module.id]}</p>
              </SceneMotionLayer>
            );
          })}

          <SceneMotionLayer
            delay={0}
            className="relative z-[2] col-span-2 flex items-center justify-center md:col-span-1 md:col-start-3 md:row-start-1 md:row-end-2"
          >
            <ScenePanel padding="compact" className={cn(sceneStyles.activeSurface, "w-full text-center shadow-[var(--marketing-shadow-soft)]")}>
              <SceneAvatar name={SCENE_CUSTOMER} size="lg" className="mx-auto" />
              <p className={cn(sceneStyles.name, "mt-2 text-sm")}>{SCENE_CUSTOMER}</p>
              <p className={sceneStyles.meta}>
                {locale === "id" ? "Satu konteks pelanggan" : "One customer context"}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                <span className={cn(sceneStyles.mutedSurface, "px-2 py-0.5 text-[10px]")}>
                  {locale === "id" ? "Inbox open" : "Inbox open"}
                </span>
                <span className={cn(sceneStyles.mutedSurface, "px-2 py-0.5 text-[10px]")}>
                  {locale === "id" ? "Proposal" : "Proposal"}
                </span>
              </div>
            </ScenePanel>
          </SceneMotionLayer>

          <SceneMotionLayer
            delay={120}
            className={cn(
              sceneStyles.primarySurface,
              "relative z-[1] col-span-2 md:col-span-3 md:col-start-2 md:row-start-2",
            )}
          >
            <ScenePanel padding="compact" className="shadow-none" title={locale === "id" ? "Timeline bersama" : "Shared timeline"}>
              <ol className="grid gap-0 sm:grid-cols-2 md:grid-cols-4">
                {timeline.map((item, index) => (
                  <SceneTimelineItem
                    key={item.label}
                    label={item.label}
                    active={item.active}
                    last={index === timeline.length - 1}
                  />
                ))}
              </ol>
            </ScenePanel>
          </SceneMotionLayer>
        </div>
      </div>
    </SceneWindow>
  );
}

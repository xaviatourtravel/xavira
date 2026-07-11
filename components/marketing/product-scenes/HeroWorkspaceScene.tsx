"use client";

import {
  BarChart3,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { m } from "framer-motion";
import type { ReactNode } from "react";

import {
  calloutVariants,
  motionTransition,
} from "@/components/marketing/motion";
import { useHeroMotion } from "@/components/marketing/motion/motion-scene-context";
import { marketingMotionDurations } from "@/components/marketing/motion/motion-tokens";
import { SceneAvatar } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneMessage } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneToolbar } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneCopy } from "@/components/marketing/product-scenes/scene-copy";
import { SCENE_CUSTOMER, sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "messages", Icon: MessageSquare },
  { id: "customers", Icon: Users },
  { id: "operations", Icon: LayoutGrid },
  { id: "finance", Icon: CreditCard },
  { id: "analytics", Icon: BarChart3 },
] as const;

function QueueRow({
  name,
  preview,
  time,
  active,
  unread,
}: {
  name: string;
  preview: string;
  time: string;
  active?: boolean;
  unread?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[var(--marketing-radius-sm)] px-2 py-2",
        active ? sceneStyles.selectedSurface : sceneStyles.mutedSurface,
        !active && "opacity-80",
      )}
    >
      <SceneAvatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className={cn(sceneStyles.name, active && "text-[var(--marketing-primary-muted-foreground)]")}>
            {name}
          </p>
          <p className={sceneStyles.meta}>{time}</p>
        </div>
        <p className={cn(sceneStyles.label, "truncate")}>{preview}</p>
      </div>
      {unread ? (
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--marketing-primary)]" aria-hidden />
      ) : null}
    </div>
  );
}

function FloatingCallout({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { reducedMotion } = useHeroMotion();

  if (reducedMotion) {
    return (
      <div className={cn(sceneStyles.calloutFloat, "absolute z-[3] px-3 py-2", className)}>
        <p className={cn(sceneStyles.label, "font-semibold text-[var(--marketing-primary-muted-foreground)]")}>
          {children}
        </p>
      </div>
    );
  }

  return (
    <m.div
      className={cn(sceneStyles.calloutFloat, "absolute z-[3] px-3 py-2", className)}
      variants={calloutVariants}
      initial="hidden"
      animate="visible"
      transition={motionTransition(marketingMotionDurations.fast, delay)}
    >
      <p className={cn(sceneStyles.label, "font-semibold text-[var(--marketing-primary-muted-foreground)]")}>
        {children}
      </p>
    </m.div>
  );
}

function HeroSceneLayer({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { reducedMotion } = useHeroMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      initial={{ opacity: 0.94, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition(marketingMotionDurations.fast, delay)}
    >
      {children}
    </m.div>
  );
}

export function HeroWorkspaceScene({ className }: { className?: string }) {
  const locale = useSceneLocale();
  const copy = sceneCopy(locale);
  const { reducedMotion } = useHeroMotion();

  const grid = (
    <div className="grid min-h-[380px] grid-cols-1 sm:min-h-[440px] lg:grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_148px_minmax(0,1.45fr)_172px]">
      <HeroSceneLayer
        className="hidden flex-col items-center gap-2 border-r border-[var(--marketing-border-subtle)] bg-[var(--marketing-scene-secondary)] py-3 xl:flex"
        delay={80}
      >
        <nav aria-hidden className="flex flex-col items-center gap-2">
          {NAV_ITEMS.map(({ id, Icon }, index) => (
            <span
              key={id}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-[var(--marketing-radius-sm)]",
                index === 0
                  ? "bg-[var(--marketing-scene-active)] text-[var(--marketing-primary)] ring-1 ring-[var(--marketing-border-accent)]"
                  : "text-[var(--marketing-muted)]",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </nav>
      </HeroSceneLayer>

      <HeroSceneLayer
        className="hidden border-r border-[var(--marketing-border-subtle)] bg-[var(--marketing-scene-secondary)] p-2 opacity-95 xl:block"
        delay={100}
      >
        <p className={cn(sceneStyles.title, "mb-2 px-1")}>{copy.hero.queue}</p>
        <div className="space-y-1">
          <QueueRow
            name={SCENE_CUSTOMER}
            preview={copy.hero.messages.inbound.slice(0, 38) + "…"}
            time="2m"
            active
            unread
          />
          <QueueRow name="Reza Pratama" preview="Invoice sent · awaiting reply" time="18m" />
          <QueueRow name="Lumen Academy" preview="Enrollment docs received" time="1h" />
        </div>
      </HeroSceneLayer>

      <div className={cn(sceneStyles.activeSurface, "flex min-w-0 flex-col p-3 sm:p-4")}>
        <HeroSceneLayer delay={180}>
          <div className="mb-3 flex items-center gap-2 border-b border-[var(--marketing-border-accent)] pb-3">
            <SceneAvatar name={SCENE_CUSTOMER} />
            <div className="min-w-0 flex-1">
              <p className={cn(sceneStyles.name, "text-sm")}>{SCENE_CUSTOMER}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <SceneBadge tone="channel-whatsapp">{copy.channels.whatsapp}</SceneBadge>
                <SceneBadge tone="primary">{locale === "id" ? "Qualified" : "Qualified"}</SceneBadge>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <SceneMessage direction="in" name={SCENE_CUSTOMER} time={`${copy.channels.whatsapp} · 2m`}>
              {copy.hero.messages.inbound}
            </SceneMessage>
            <SceneMessage direction="out" time={locale === "id" ? "Baru saja" : "Just now"} showAvatar={false}>
              {copy.hero.messages.outbound}
            </SceneMessage>
          </div>
        </HeroSceneLayer>

        <HeroSceneLayer delay={340}>
          <div className={cn(sceneStyles.accentSurface, "mt-3 flex items-start gap-2 p-2.5")}>
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--marketing-accent)]" aria-hidden />
            <div>
              <p className={cn(sceneStyles.label, "font-semibold text-[var(--marketing-accent)]")}>
                {copy.hero.callouts.aurora}
              </p>
              <p className={cn(sceneStyles.meta, "mt-0.5")}>{copy.aurora.humanRequired}</p>
            </div>
          </div>
        </HeroSceneLayer>

        <div
          className="mt-3 h-9 rounded-[var(--marketing-radius-sm)] border border-[var(--marketing-border-subtle)] bg-[var(--marketing-scene-primary)]"
          aria-hidden
        />
      </div>

      <HeroSceneLayer
        className="hidden bg-[var(--marketing-scene-secondary)] p-3 xl:block"
        delay={260}
      >
        <p className={cn(sceneStyles.title, "mb-2")}>{copy.hero.context}</p>
        <ScenePanel padding="compact" className={cn(sceneStyles.primarySurface, "space-y-2.5 shadow-none")}>
          <SceneBadge tone="success">{copy.hero.callouts.qualified}</SceneBadge>
          <div>
            <p className={sceneStyles.meta}>{copy.hero.stage}</p>
            <p className={sceneStyles.name}>{locale === "id" ? "Proposal" : "Proposal"}</p>
          </div>
          <div>
            <p className={sceneStyles.meta}>{copy.hero.operation}</p>
            <p className={sceneStyles.label}>
              {locale === "id" ? "Enterprise plan · review" : "Enterprise plan · review"}
            </p>
          </div>
          <div>
            <p className={sceneStyles.meta}>{copy.hero.nextAction}</p>
            <p className={sceneStyles.label}>{copy.hero.callouts.followUp}</p>
          </div>
        </ScenePanel>
      </HeroSceneLayer>
    </div>
  );

  return (
    <SceneWindow className={className} label="Desklabs communication workspace">
      <SceneToolbar title={copy.hero.toolbar} />
      <div className={cn(sceneStyles.canvas, "relative m-2 sm:m-3")}>
        {reducedMotion ? (
          grid
        ) : (
          <HeroSceneLayer delay={0}>{grid}</HeroSceneLayer>
        )}

        <FloatingCallout className="right-3 top-3 hidden lg:block" delay={420}>
          {copy.hero.callouts.qualified}
        </FloatingCallout>
        <FloatingCallout className="bottom-5 left-[24%] hidden xl:block" delay={500}>
          {copy.hero.callouts.followUp}
        </FloatingCallout>
      </div>
    </SceneWindow>
  );
}

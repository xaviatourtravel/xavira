"use client";

import { Bot, Sparkles } from "lucide-react";

import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneMessage } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { SceneWindow } from "@/components/marketing/product-scenes/primitives/SceneWindow";
import { sceneCopy } from "@/components/marketing/product-scenes/scene-copy";
import { sceneStyles, SCENE_CUSTOMER } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

function StaticControl({
  label,
  emphasis = false,
  className,
}: {
  label: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      tabIndex={-1}
      className={cn(
        "rounded-[var(--marketing-radius-sm)] px-2.5 py-2",
        emphasis ? sceneStyles.activeSurface : sceneStyles.secondarySurface,
        emphasis && "ring-1 ring-[var(--marketing-border-accent)]",
        className,
      )}
    >
      <p
        className={cn(
          sceneStyles.label,
          emphasis && "font-semibold text-[var(--marketing-primary-muted-foreground)]",
        )}
      >
        {label}
      </p>
    </div>
  );
}

export function AuroraAssistScene({ className, compact }: { className?: string; compact?: boolean }) {
  const locale = useSceneLocale();
  const copy = sceneCopy(locale);

  return (
    <SceneWindow className={className} label="Aurora AI assistance">
      <div className={cn(sceneStyles.canvas, "m-2 p-3 sm:m-3 sm:p-4", compact && "p-2.5")}>
        <div className="grid gap-3 lg:grid-cols-[0.9fr_1fr_1fr]">
          <ScenePanel padding="compact" className={sceneStyles.secondarySurface} title={locale === "id" ? "Percakapan" : "Conversation"}>
            <SceneMessage direction="in" name={SCENE_CUSTOMER} time="WA · 5m" showAvatar>
              {locale === "id" ? "Bisa follow up minggu depan?" : "Can we follow up next week?"}
            </SceneMessage>
          </ScenePanel>

          <ScenePanel padding="compact" className={sceneStyles.accentSurface}>
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--marketing-accent)]" aria-hidden />
              <Bot className="h-3.5 w-3.5 text-[var(--marketing-accent-secondary)]" aria-hidden />
              <p className={sceneStyles.title}>Aurora</p>
            </div>
            <p className={cn(sceneStyles.label, "font-semibold text-[var(--marketing-accent)]")}>
              {locale === "id" ? "Intent: follow-up scheduling" : "Intent: follow-up scheduling"}
            </p>
            <p className={cn(sceneStyles.body, "mt-2")}>
              {locale === "id"
                ? "Pelanggan siap lanjut. Proposal sudah dibagikan."
                : "Customer ready to proceed. Proposal already shared."}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <SceneBadge tone="default">{locale === "id" ? "Stage: Proposal" : "Stage: Proposal"}</SceneBadge>
              <SceneBadge tone="accent">{locale === "id" ? "Missing: call time" : "Missing: call time"}</SceneBadge>
            </div>
          </ScenePanel>

          <ScenePanel padding="compact" className={sceneStyles.primarySurface} title={locale === "id" ? "Draft & approval" : "Draft & approval"}>
            <div className={cn(sceneStyles.mutedSurface, "px-2.5 py-2")}>
              <p className={sceneStyles.body}>
                {locale === "id"
                  ? "Baik Nadia, kami jadwalkan follow-up Senin pukul 10.00."
                  : "Sure Nadia, we'll schedule follow-up Monday at 10:00."}
              </p>
            </div>
            <p className={cn(sceneStyles.meta, "mt-2 font-medium")}>{copy.aurora.suggestedStep}</p>
            <p className={sceneStyles.label}>
              {locale === "id" ? "Schedule call · assign owner" : "Schedule call · assign owner"}
            </p>
            <div className="mt-3 space-y-1.5">
              <StaticControl label={copy.aurora.reviewDraft} />
              <StaticControl label={copy.aurora.editResponse} />
              <StaticControl label={copy.aurora.approveSend} emphasis />
            </div>
            <p className={cn(sceneStyles.meta, "mt-3 font-semibold text-[var(--marketing-primary)]")}>
              {copy.aurora.humanRequired}
            </p>
          </ScenePanel>
        </div>
      </div>
    </SceneWindow>
  );
}

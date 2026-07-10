"use client";

import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneMetric } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function AgencyIndustryScene({ className }: { className?: string }) {
  const locale = useSceneLocale();
  const id = locale === "id";

  return (
    <div className={cn(sceneStyles.canvas, "p-3 sm:p-4", className)} aria-hidden>
      <div className="mb-2 flex items-center justify-between">
        <p className={sceneStyles.name}>Northline Studio</p>
        <SceneBadge tone="primary">{id ? "Client project" : "Client project"}</SceneBadge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <ScenePanel padding="compact" title={id ? "Inquiry" : "Inquiry"}>
          <p className={sceneStyles.label}>{id ? "Brand launch Q3" : "Brand launch Q3"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Proposal" : "Proposal"}>
          <p className={sceneStyles.name}>{id ? "Sent · feedback pending" : "Sent · feedback pending"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Project" : "Project"}>
          <SceneMetric label={id ? "Stage" : "Stage"} value={id ? "Discovery" : "Discovery"} />
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Invoice" : "Invoice"}>
          <p className={sceneStyles.label}>{id ? "Draft · awaiting approval" : "Draft · awaiting approval"}</p>
        </ScenePanel>
      </div>
    </div>
  );
}

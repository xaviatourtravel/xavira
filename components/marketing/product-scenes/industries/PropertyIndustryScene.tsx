"use client";

import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneMetric } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function PropertyIndustryScene({ className }: { className?: string }) {
  const locale = useSceneLocale();
  const id = locale === "id";

  return (
    <div className={cn(sceneStyles.canvas, "p-3 sm:p-4", className)} aria-hidden>
      <div className="mb-2 flex items-center justify-between">
        <p className={sceneStyles.name}>Nusa Property</p>
        <SceneBadge tone="warning">{id ? "Hot lead" : "Hot lead"}</SceneBadge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <ScenePanel padding="compact" title={id ? "Lead" : "Lead"}>
          <p className={sceneStyles.label}>2BR Tower A · 1.2B</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Property" : "Property"}>
          <p className={sceneStyles.name}>{id ? "Unit A-1204 selected" : "Unit A-1204 selected"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Viewing" : "Viewing"}>
          <SceneMetric label={id ? "Jadwal" : "Schedule"} value="Sat 10:00" />
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Negotiation" : "Negotiation"}>
          <p className={sceneStyles.label}>{id ? "Offer under review" : "Offer under review"}</p>
        </ScenePanel>
      </div>
    </div>
  );
}

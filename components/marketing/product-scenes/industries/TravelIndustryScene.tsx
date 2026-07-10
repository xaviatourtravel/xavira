"use client";

import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneMetric } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function TravelIndustryScene({ className }: { className?: string }) {
  const locale = useSceneLocale();
  const id = locale === "id";

  return (
    <div className={cn(sceneStyles.canvas, "p-3 sm:p-4", className)} aria-hidden>
      <div className="grid gap-2 sm:grid-cols-2">
        <ScenePanel padding="compact" title={id ? "Inquiry" : "Inquiry"}>
          <p className={sceneStyles.label}>Bali 5D4N · 4 pax</p>
          <SceneBadge tone="channel-whatsapp" className="mt-2">WA</SceneBadge>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Quotation" : "Quotation"}>
          <p className={sceneStyles.name}>QT-2841</p>
          <p className={sceneStyles.meta}>{id ? "Sent · awaiting reply" : "Sent · awaiting reply"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Booking" : "Booking"}>
          <p className={sceneStyles.name}>BK-1092</p>
          <SceneBadge tone="success" className="mt-1">{id ? "Confirmed" : "Confirmed"}</SceneBadge>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Departure" : "Departure"}>
          <SceneMetric label={id ? "Tanggal" : "Date"} value="12 Aug · 4 pax" />
        </ScenePanel>
      </div>
    </div>
  );
}

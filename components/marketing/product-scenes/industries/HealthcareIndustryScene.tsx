"use client";

import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneMetric } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function HealthcareIndustryScene({ className }: { className?: string }) {
  const locale = useSceneLocale();
  const id = locale === "id";

  return (
    <div className={cn(sceneStyles.canvas, "p-3 sm:p-4", className)} aria-hidden>
      <div className="mb-2 flex items-center justify-between">
        <p className={sceneStyles.name}>SehatCare Clinic</p>
        <SceneBadge tone="default">{id ? "Non-clinical" : "Non-clinical"}</SceneBadge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <ScenePanel padding="compact" title={id ? "Appointment" : "Appointment"}>
          <p className={sceneStyles.label}>{id ? "Dental check · first visit" : "Dental check · first visit"}</p>
          <SceneBadge tone="success" className="mt-2">{id ? "Reminder sent" : "Reminder sent"}</SceneBadge>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Intake" : "Intake"}>
          <p className={sceneStyles.name}>{id ? "Form complete" : "Form complete"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Follow-up" : "Follow-up"}>
          <p className={sceneStyles.label}>{id ? "Post-visit coordination" : "Post-visit coordination"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Schedule" : "Schedule"}>
          <SceneMetric label={id ? "Next" : "Next"} value="Thu 14:00" />
        </ScenePanel>
      </div>
    </div>
  );
}

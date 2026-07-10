"use client";

import { SceneBadge } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { SceneMetric } from "@/components/marketing/product-scenes/primitives/SceneMessage";
import { ScenePanel } from "@/components/marketing/product-scenes/primitives/ScenePanel";
import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { useSceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";
import { cn } from "@/lib/utils";

export function EducationIndustryScene({ className }: { className?: string }) {
  const locale = useSceneLocale();
  const id = locale === "id";

  return (
    <div className={cn(sceneStyles.canvas, "p-3 sm:p-4", className)} aria-hidden>
      <div className="mb-2 flex items-center justify-between">
        <p className={sceneStyles.name}>Lumen Academy</p>
        <SceneBadge tone="primary">{id ? "Admission" : "Admission"}</SceneBadge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <ScenePanel padding="compact" title={id ? "Inquiry" : "Inquiry"}>
          <p className={sceneStyles.label}>{id ? "Grade 7 intake · parent" : "Grade 7 intake · parent"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Enrollment" : "Enrollment"}>
          <p className={sceneStyles.name}>{id ? "Docs review" : "Docs review"}</p>
          <p className={sceneStyles.meta}>{id ? "Interview Thu" : "Interview Thu"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Class context" : "Class context"}>
          <p className={sceneStyles.label}>{id ? "Grade 7 · Morning" : "Grade 7 · Morning"}</p>
        </ScenePanel>
        <ScenePanel padding="compact" title={id ? "Payment" : "Payment"}>
          <SceneMetric label={id ? "Status" : "Status"} value={id ? "Pending" : "Pending"} />
        </ScenePanel>
      </div>
    </div>
  );
}

"use client";

import { AgencyIndustryScene } from "@/components/marketing/product-scenes/industries/AgencyIndustryScene";
import { EducationIndustryScene } from "@/components/marketing/product-scenes/industries/EducationIndustryScene";
import { HealthcareIndustryScene } from "@/components/marketing/product-scenes/industries/HealthcareIndustryScene";
import { PropertyIndustryScene } from "@/components/marketing/product-scenes/industries/PropertyIndustryScene";
import { TravelIndustryScene } from "@/components/marketing/product-scenes/industries/TravelIndustryScene";
import { cn } from "@/lib/utils";

export type IndustrySceneId = "travel" | "education" | "healthcare" | "property" | "agency";

const SCENES = {
  travel: TravelIndustryScene,
  education: EducationIndustryScene,
  healthcare: HealthcareIndustryScene,
  property: PropertyIndustryScene,
  agency: AgencyIndustryScene,
} as const;

export function IndustryScene({
  industryId,
  className,
  size = "default",
}: {
  industryId: IndustrySceneId;
  className?: string;
  size?: "default" | "large";
}) {
  const Component = SCENES[industryId];

  return (
    <Component
      className={cn(size === "large" && "min-h-[180px] sm:min-h-[200px]", className)}
    />
  );
}

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  Brain,
  ChartColumn,
  FileText,
  Fingerprint,
  LayoutDashboard,
  Package,
  Rocket,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import type { BusinessBrainSectionSlug } from "@/modules/business-brain/types/business-brain-workspace";
import { cn } from "@/lib/utils";

export const BUSINESS_BRAIN_ICON_SIZE = 16;
export const BUSINESS_BRAIN_ICON_STROKE = 1.75;

type BusinessBrainSectionIconSlug =
  | BusinessBrainSectionSlug
  | "module"
  | "automation"
  | "insights"
  | "aiActions";

const SECTION_ICONS: Record<BusinessBrainSectionIconSlug, LucideIcon> = {
  module: Brain,
  overview: LayoutDashboard,
  identity: Fingerprint,
  products: Package,
  knowledge: BookOpen,
  documents: FileText,
  behaviors: ShieldCheck,
  playground: Bot,
  publish: Rocket,
  "ai-permissions": ShieldCheck,
  automation: Workflow,
  insights: ChartColumn,
  aiActions: Sparkles,
};

export function BusinessBrainSectionIcon({
  slug,
  className,
}: {
  slug: BusinessBrainSectionIconSlug;
  className?: string;
}) {
  const Icon = SECTION_ICONS[slug];
  return (
    <Icon
      className={cn("h-4 w-4 shrink-0", className)}
      size={BUSINESS_BRAIN_ICON_SIZE}
      strokeWidth={BUSINESS_BRAIN_ICON_STROKE}
      aria-hidden
    />
  );
}

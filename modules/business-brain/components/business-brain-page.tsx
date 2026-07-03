import {
  Activity,
  BookOpen,
  Brain,
  FileText,
  Package,
  Sparkles,
  Upload,
} from "lucide-react";

import { AppWorkspaceFrame } from "@/components/layout/app-workspace-frame";
import { BusinessBrainMetricCardView } from "@/modules/business-brain/components/business-brain-metric-card";
import { BusinessBrainSidePanel } from "@/modules/business-brain/components/business-brain-side-panel";
import { getBusinessBrainDashboardPlaceholder } from "@/modules/business-brain/services";
import type { BusinessBrainMetricCardId } from "@/modules/business-brain/types";

const METRIC_ICONS: Record<
  BusinessBrainMetricCardId,
  typeof Brain
> = {
  "brain-health": Activity,
  "ai-readiness": Sparkles,
  knowledge: BookOpen,
  products: Package,
  documents: FileText,
  "publish-status": Upload,
};

export function BusinessBrainPage() {
  const dashboard = getBusinessBrainDashboardPlaceholder();

  return (
    <AppWorkspaceFrame
      header={
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground md:text-2xl">
            Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Track how complete and ready your Business Brain is.
          </p>
        </div>
      }
      contextPanel={
        <BusinessBrainSidePanel
          suggestions={dashboard.suggestions}
          recentChanges={dashboard.recentChanges}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboard.metrics.map((card) => {
          const Icon = METRIC_ICONS[card.id];

          return (
            <BusinessBrainMetricCardView key={card.id} card={card} icon={Icon} />
          );
        })}
      </div>
    </AppWorkspaceFrame>
  );
}

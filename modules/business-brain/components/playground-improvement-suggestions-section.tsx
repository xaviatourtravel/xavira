"use client";

import { ArrowRight } from "lucide-react";
import { useCallback } from "react";

import { DsButton } from "@/components/design-system/button";
import { useBusinessBrainWorkspaceOptional } from "@/modules/business-brain/components/business-brain-workspace-context";
import { InspectorSection } from "@/modules/business-brain/components/inspector/inspector-primitives";
import type { PlaygroundImprovementSuggestionsView } from "@/modules/business-brain/types/playground-improvement-suggestions";
import { sectionSlugFromHref } from "@/modules/business-brain/types/business-brain-workspace";
import { useTranslation } from "@/lib/i18n/use-translation";

type PlaygroundImprovementSuggestionsSectionProps = {
  suggestions: PlaygroundImprovementSuggestionsView;
};

function useNavigateToTargetPage() {
  const workspace = useBusinessBrainWorkspaceOptional();

  return useCallback(
    (targetPage: string) => {
      const slug = sectionSlugFromHref(targetPage);
      if (workspace && slug) {
        workspace.navigate(slug);
        window.history.replaceState({ bbSection: slug }, "", targetPage);
        return;
      }

      window.location.assign(targetPage);
    },
    [workspace],
  );
}

export function PlaygroundImprovementSuggestionsSection({
  suggestions,
}: PlaygroundImprovementSuggestionsSectionProps) {
  const { tStrict } = useTranslation();
  const navigateToTargetPage = useNavigateToTargetPage();

  if (suggestions.items.length === 0) {
    return null;
  }

  return (
    <InspectorSection title={tStrict("testAi.improveYourAi")}>
      <div className="space-y-3">
        {suggestions.items.map((item, index) => (
          <div key={item.id}>
            {index > 0 ? <div className="mb-3 border-t border-border/70" /> : null}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {tStrict("testAi.expectedImpact")}{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {item.expectedImpact}
                </span>
              </p>
              <DsButton
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigateToTargetPage(item.targetPage)}
              >
                {item.buttonLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </DsButton>
            </div>
          </div>
        ))}
      </div>
    </InspectorSection>
  );
}

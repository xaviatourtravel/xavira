"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import { useBusinessBrainWorkspaceOptional } from "@/modules/business-brain/components/business-brain-workspace-context";
import {
  InspectorEmptyState,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { sectionSlugFromHref } from "@/modules/business-brain/types/business-brain-workspace";
import type {
  BusinessBrainRecentChange,
  BusinessBrainSuggestion,
} from "@/modules/business-brain/types";

type OverviewInspectorProps = {
  suggestions: BusinessBrainSuggestion[];
  recentChanges: BusinessBrainRecentChange[];
};

function SuggestionLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  const workspace = useBusinessBrainWorkspaceOptional();
  const slug = sectionSlugFromHref(href);

  if (workspace && slug) {
    return (
      <button
        type="button"
        onClick={() => workspace.navigate(slug)}
        className="block w-full text-left hover:opacity-90"
      >
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </button>
    );
  }

  return (
    <Link href={href} className="block hover:opacity-90">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  );
}

export function OverviewInspector({ suggestions, recentChanges }: OverviewInspectorProps) {
  return (
    <BusinessBrainInspector
      title="Insights"
      subtitle="Recommended improvements and recent activity."
      icon={Lightbulb}
      contentKey={`${suggestions.length}-${recentChanges.length}`}
    >
      <InspectorSection title="Recommended Actions">
        {suggestions.length > 0 ? (
          <ul className="space-y-2">
            {suggestions.map((item) => (
              <li key={item.id} className="rounded-lg bg-muted/35 px-3 py-2.5">
                {item.href ? (
                  <SuggestionLink
                    href={item.href}
                    title={item.title}
                    description={item.description}
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <InspectorEmptyState message="Nothing here yet. Add content to surface recommended actions." />
        )}
      </InspectorSection>

      <InspectorSection title="Recent Changes">
        {recentChanges.length > 0 ? (
          <InspectorList
            items={recentChanges.map((item) => ({
              id: item.id,
              label: item.label,
              detail: item.timestampLabel,
            }))}
          />
        ) : (
          <InspectorEmptyState message="Nothing here yet. Changes will appear here as you edit." />
        )}
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

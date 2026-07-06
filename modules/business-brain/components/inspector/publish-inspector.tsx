"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";

import { formatTranslation } from "@/lib/i18n/dictionary";
import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import type {
  BrainDraftSummary,
  BrainPublishStatusView,
} from "@/modules/business-brain/types/publish";
import { cn } from "@/lib/utils";

type PublishInspectorProps = {
  status: BrainPublishStatusView;
  draftSummary: BrainDraftSummary;
};

function formatDateTime(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PublishInspector({ status, draftSummary }: PublishInspectorProps) {
  const { bb, locale } = useBbTranslation();
  const published = status.status === "published";
  const changedSections = draftSummary.sections.filter(
    (section) => section.added + section.edited + section.removed > 0,
  );

  return (
    <BusinessBrainInspector
      title={bb("publishSummary")}
      subtitle={bb("publishSummarySubtitle")}
      icon={Rocket}
      contentKey={`${status.status}-${draftSummary.totalChanges}`}
    >
      <InspectorSection title={bb("status")}>
        <InspectorBadge variant={published ? "success" : "warning"}>
          {published ? bb("published") : bb("draft")}
        </InspectorBadge>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <p>
            {bb("lastPublished")}{" "}
            <span className="text-foreground">
              {formatDateTime(status.lastPublishedAt, locale)}
            </span>
          </p>
          {status.lastPublishedBy ? (
            <p>
              {bb("by")}{" "}
              <span className="text-foreground">{status.lastPublishedBy.name}</span>
            </p>
          ) : null}
          {status.currentVersionNumber ? (
            <p>
              {bb("liveVersion")}{" "}
              <span className="text-foreground">v{status.currentVersionNumber}</span>
            </p>
          ) : null}
        </div>
      </InspectorSection>

      <InspectorSection title={bb("pendingChanges")}>
        <InspectorBadge
          variant={draftSummary.totalChanges > 0 ? "warning" : "success"}
          className={cn("tabular-nums")}
        >
          {formatTranslation(bb("changesCount"), { count: draftSummary.totalChanges })}
        </InspectorBadge>
        {changedSections.length > 0 ? (
          <div className="mt-3">
            <InspectorList
              items={changedSections.map((section) => ({
                id: section.section,
                label: section.label,
                detail: `+${section.added} · ~${section.edited} · −${section.removed}`,
              }))}
            />
          </div>
        ) : null}
      </InspectorSection>

      <InspectorSection title={bb("quickActions")}>
        <Link
          href="/business-brain/playground"
          className="inline-flex text-xs font-medium text-primary hover:underline"
        >
          {bb("previewInTestAiLink")}
        </Link>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import type {
  BrainDraftSummary,
  BrainPublishStatusView,
} from "@/modules/business-brain/types/publish";
import { cn } from "@/lib/utils";

type PublishInspectorProps = {
  status: BrainPublishStatusView;
  draftSummary: BrainDraftSummary;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PublishInspector({ status, draftSummary }: PublishInspectorProps) {
  const published = status.status === "published";
  const changedSections = draftSummary.sections.filter(
    (section) => section.added + section.edited + section.removed > 0,
  );

  return (
    <BusinessBrainInspector
      title="Publish Summary"
      subtitle="Live status and pending changes."
      icon={Rocket}
      contentKey={`${status.status}-${draftSummary.totalChanges}`}
    >
      <InspectorSection title="Status">
        <InspectorBadge variant={published ? "success" : "warning"}>
          {published ? "Published" : "Draft"}
        </InspectorBadge>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <p>
            Last published:{" "}
            <span className="text-foreground">{formatDateTime(status.lastPublishedAt)}</span>
          </p>
          {status.lastPublishedBy ? (
            <p>
              By: <span className="text-foreground">{status.lastPublishedBy.name}</span>
            </p>
          ) : null}
          {status.currentVersionNumber ? (
            <p>
              Live version:{" "}
              <span className="text-foreground">v{status.currentVersionNumber}</span>
            </p>
          ) : null}
        </div>
      </InspectorSection>

      <InspectorSection title="Pending Changes">
        <InspectorBadge
          variant={draftSummary.totalChanges > 0 ? "warning" : "success"}
          className={cn("tabular-nums")}
        >
          {draftSummary.totalChanges} change{draftSummary.totalChanges === 1 ? "" : "s"}
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

      <InspectorSection title="Quick Actions">
        <Link
          href="/business-brain/playground"
          className="inline-flex text-xs font-medium text-primary hover:underline"
        >
          Preview in Test AI →
        </Link>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Rocket, Upload } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { publishBusinessBrainAction } from "@/modules/business-brain/actions/publish-actions";
import {
  BusinessBrainCompactSection,
  BusinessBrainContentShell,
  BusinessBrainTwoColumnLayout,
} from "@/modules/business-brain/components/business-brain-content-shell";
import { ExpandableList } from "@/modules/business-brain/components/expandable-list";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import type {
  BrainDraftSummary,
  BrainPublishStatusView,
  BrainSectionChangeSummary,
  BrainVersionListItem,
} from "@/modules/business-brain/types/publish";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type PublishPageClientProps = {
  initialStatus: BrainPublishStatusView;
  initialDraftSummary: BrainDraftSummary;
  initialVersions: BrainVersionListItem[];
  canPublish: boolean;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: BrainPublishStatusView["status"] }) {
  const { tStrict } = useTranslation();
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        published
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
      )}
    >
      {published ? tStrict("businessBrain.published") : tStrict("businessBrain.draft")}
    </span>
  );
}

function ChangeCountCell({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value > 0 ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

function ChangeSummaryTable({ sections }: { sections: BrainSectionChangeSummary[] }) {
  const { tStrict } = useTranslation();

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {tStrict("businessBrain.changeSummaryEmpty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">{tStrict("businessBrain.section")}</th>
            <th className="px-4 py-3 font-medium">{tStrict("businessBrain.added")}</th>
            <th className="px-4 py-3 font-medium">{tStrict("businessBrain.edited")}</th>
            <th className="px-4 py-3 font-medium">{tStrict("businessBrain.removed")}</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <tr key={section.section} className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">{section.label}</td>
              <td className="px-4 py-3">
                <ChangeCountCell value={section.added} />
              </td>
              <td className="px-4 py-3">
                <ChangeCountCell value={section.edited} />
              </td>
              <td className="px-4 py-3">
                <ChangeCountCell value={section.removed} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PublishPageClient({
  initialStatus,
  initialDraftSummary,
  initialVersions,
  canPublish,
}: PublishPageClientProps) {
  const { tStrict } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [draftSummary, setDraftSummary] = useState(initialDraftSummary);
  const [versions, setVersions] = useState(initialVersions);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPublishing, startPublishTransition] = useTransition();

  const canPublishNow =
    canPublish &&
    (status.status === "draft" || draftSummary.hasUnpublishedChanges);

  const handlePublish = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startPublishTransition(async () => {
      const result = await publishBusinessBrainAction();
      if (!result.ok || !result.result) {
        setErrorMessage(result.ok ? tStrict("businessBrain.publishFailed") : result.error);
        return;
      }

      setStatus(result.result.status);
      setDraftSummary({
        sections: draftSummary.sections.map((section) => ({
          ...section,
          added: 0,
          edited: 0,
          removed: 0,
        })),
        totalChanges: 0,
        hasUnpublishedChanges: false,
      });
      setVersions((current) => [result.result.version, ...current]);
      setSuccessMessage(`Business Brain v${result.result.version.versionNumber} published.`);
      router.refresh();
    });
  };

  return (
    <BusinessBrainContentShell>
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(tStrict, "publish")}
        iconSlug="publish"
        description={translateBusinessBrainSectionDescription(tStrict, "publish")}
        actions={
          canPublish ? (
            <DsButton
              type="button"
              onClick={handlePublish}
              loading={isPublishing}
              disabled={!canPublishNow}
            >
              <Rocket className="h-4 w-4" />
              {tStrict("businessBrain.publishButton")}
            </DsButton>
          ) : null
        }
        status={
          <>
            {successMessage ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {successMessage}
              </span>
            ) : null}
            {errorMessage ? (
              <span className="text-sm text-destructive">{errorMessage}</span>
            ) : null}
            {!canPublish ? (
              <span className="text-sm text-muted-foreground">
                {tStrict("businessBrain.adminOnlyPublish")}
              </span>
            ) : null}
          </>
        }
      />
      <BusinessBrainTwoColumnLayout
        left={
          <>
            <BusinessBrainCompactSection title={tStrict("businessBrain.publishStatus")}>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {tStrict("businessBrain.currentStatus")}
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge status={status.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {tStrict("businessBrain.lastPublishedAt")}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {formatDateTime(status.lastPublishedAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {tStrict("businessBrain.lastPublishedBy")}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {status.lastPublishedBy?.name ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {tStrict("businessBrain.draftChangesCount")}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {draftSummary.totalChanges}
                    {status.currentVersionNumber ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (live v{status.currentVersionNumber})
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </BusinessBrainCompactSection>

            <BusinessBrainCompactSection
              title={tStrict("businessBrain.changeSummary")}
              description={tStrict("businessBrain.changeSummaryDescription")}
            >
              <ChangeSummaryTable sections={draftSummary.sections} />
            </BusinessBrainCompactSection>
          </>
        }
        right={
          <>
            <BusinessBrainCompactSection title={tStrict("businessBrain.preview")}>
              <Link
                href="/business-brain/playground"
                className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-border/70 bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                {tStrict("businessBrain.previewInTestAi")}
              </Link>
              {!canPublishNow && canPublish && status.status === "published" ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {tStrict("businessBrain.noUnpublishedChanges")}
                </p>
              ) : null}
            </BusinessBrainCompactSection>

            <BusinessBrainCompactSection
              title={tStrict("businessBrain.versionHistory")}
              description={tStrict("businessBrain.versionHistoryDescription")}
            >
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center">
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {tStrict("businessBrain.noVersionsYet")}
                  </p>
                </div>
              ) : (
                <ExpandableList
                  items={versions}
                  itemsClassName="space-y-1.5"
                  getItemKey={(version) => version.id}
                  renderItem={(version) => (
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/70 px-2.5 py-2 text-sm sm:grid-cols-4">
                      <span className="font-medium text-foreground">v{version.versionNumber}</span>
                      <span className="text-foreground">{formatDateTime(version.publishedAt)}</span>
                      <span className="text-foreground">{version.publishedBy?.name ?? "—"}</span>
                      <span>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            version.status === "published"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {version.status === "published"
                            ? tStrict("businessBrain.active")
                            : tStrict("businessBrain.superseded")}
                        </span>
                      </span>
                    </div>
                  )}
                />
              )}
            </BusinessBrainCompactSection>
          </>
        }
      />
    </BusinessBrainContentShell>
  );
}

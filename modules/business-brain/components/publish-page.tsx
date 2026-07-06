"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Rocket, Upload } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { publishBusinessBrainAction } from "@/modules/business-brain/actions/publish-actions";
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
    <div className="space-y-6">
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
      <DsCard title={tStrict("businessBrain.publishStatus")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tStrict("businessBrain.currentStatus")}
            </p>
            <div className="mt-2">
              <StatusBadge status={status.status} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tStrict("businessBrain.lastPublishedAt")}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {formatDateTime(status.lastPublishedAt)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tStrict("businessBrain.lastPublishedBy")}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {status.lastPublishedBy?.name ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tStrict("businessBrain.draftChangesCount")}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {draftSummary.totalChanges}
              {status.currentVersionNumber ? (
                <span className="ml-2 text-xs text-muted-foreground">
                  (live v{status.currentVersionNumber})
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </DsCard>

      <DsCard
        title={tStrict("businessBrain.changeSummary")}
        description={tStrict("businessBrain.changeSummaryDescription")}
      >
        <ChangeSummaryTable sections={draftSummary.sections} />
      </DsCard>

      <DsCard title={tStrict("businessBrain.preview")}>
        <Link
          href="/business-brain/playground"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Eye className="h-4 w-4" />
          {tStrict("businessBrain.previewInTestAi")}
        </Link>
        {!canPublishNow && canPublish && status.status === "published" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {tStrict("businessBrain.noUnpublishedChanges")}
          </p>
        ) : null}
      </DsCard>

      <DsCard
        title={tStrict("businessBrain.versionHistory")}
        description={tStrict("businessBrain.versionHistoryDescription")}
      >
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {tStrict("businessBrain.noVersionsYet")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{tStrict("businessBrain.version")}</th>
                  <th className="px-4 py-3 font-medium">{tStrict("businessBrain.publishedAt")}</th>
                  <th className="px-4 py-3 font-medium">{tStrict("businessBrain.publishedBy")}</th>
                  <th className="px-4 py-3 font-medium">{tStrict("businessBrain.status")}</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      v{version.versionNumber}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatDateTime(version.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {version.publishedBy?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DsCard>
    </div>
  );
}

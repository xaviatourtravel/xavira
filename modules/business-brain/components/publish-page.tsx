"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Rocket, Upload } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { publishBusinessBrainAction } from "@/modules/business-brain/actions/publish-actions";
import type {
  BrainDraftSummary,
  BrainPublishStatusView,
  BrainSectionChangeSummary,
  BrainVersionListItem,
} from "@/modules/business-brain/types/publish";
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
      {published ? "Published" : "Draft"}
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
  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No Business Brain content yet. Configure modules before publishing.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Section</th>
            <th className="px-4 py-3 font-medium">Added</th>
            <th className="px-4 py-3 font-medium">Edited</th>
            <th className="px-4 py-3 font-medium">Removed</th>
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
        setErrorMessage(result.ok ? "Publish failed." : result.error);
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
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground md:text-2xl">
          Publish Business Brain
        </h2>
        <p className="text-sm text-muted-foreground">
          Review changes before your AI uses them in live conversations.
        </p>
      </div>

      <DsCard title="Publish Status">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current Status
            </p>
            <div className="mt-2">
              <StatusBadge status={status.status} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last Published At
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {formatDateTime(status.lastPublishedAt)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last Published By
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {status.lastPublishedBy?.name ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Draft Changes Count
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
        title="Change Summary"
        description="Unpublished edits compared to the last published version."
      >
        <ChangeSummaryTable sections={draftSummary.sections} />
      </DsCard>

      <DsCard title="Preview & Publish">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/business-brain/playground"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            Preview AI
          </Link>
          {canPublish ? (
            <DsButton
              type="button"
              onClick={handlePublish}
              loading={isPublishing}
              disabled={!canPublishNow}
            >
              <Rocket className="h-4 w-4" />
              Publish Business Brain
            </DsButton>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only admins and owners can publish changes.
            </p>
          )}
        </div>
        {!canPublishNow && canPublish && status.status === "published" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No unpublished changes. Edit Business Brain modules to create a new draft.
          </p>
        ) : null}
        {errorMessage ? <p className="mt-3 text-sm text-destructive">{errorMessage}</p> : null}
        {successMessage ? (
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{successMessage}</p>
        ) : null}
      </DsCard>

      <DsCard title="Version History" description="Published snapshots. Rollback is not available yet.">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No published versions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Published At</th>
                  <th className="px-4 py-3 font-medium">Published By</th>
                  <th className="px-4 py-3 font-medium">Status</th>
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
                        {version.status === "published" ? "Active" : "Superseded"}
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

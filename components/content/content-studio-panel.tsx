"use client";

import { useMemo, useState, useTransition } from "react";

import { generateContentStudio } from "@/app/(dashboard)/content/ai-actions";
import { AddToContentBoardModal } from "@/components/content/add-to-content-board-modal";
import { ContentCopyButton } from "@/components/content/content-copy-button";
import { ContentStudioHistory } from "@/components/content/content-studio-history";
import { ThumbnailStudioPanel } from "@/components/content/thumbnail-studio-panel";
import { Button } from "@/components/ui/button";
import { CONTENT_PLATFORM_OPTIONS } from "@/lib/content/constants";
import {
  CONTENT_STUDIO_ANGLES,
  CONTENT_STUDIO_GOALS,
  CONTENT_STUDIO_PILLARS,
  CONTENT_STUDIO_SOURCES,
  formatContentStudioList,
  getContentStudioAngleLabel,
  getContentStudioGoalLabel,
  getContentStudioPillarLabel,
  getContentStudioSourceBadgeClassName,
  getContentStudioSourceLabel,
  type ContentStudioGeneration,
  type ContentStudioSource,
} from "@/lib/ai/content-studio";
import type { ContentGenerationListItem } from "@/lib/content/generations";
import type { ThumbnailGenerationListItem } from "@/lib/content/thumbnail-queries";
import { parsePackageStructure } from "@/lib/packages/parse-package-structure";
import { cn } from "@/lib/utils";

type PackageOption = {
  id: string;
  name: string;
  destination: string | null;
};

type ContentStudioPanelProps = {
  packages: PackageOption[];
  initialHistory: ContentGenerationListItem[];
  initialThumbnailHistory: ThumbnailGenerationListItem[];
  profiles: ReadonlyArray<{ id: string; full_name: string | null }>;
  canManage: boolean;
};

type StudioTab = "output" | "thumbnail" | "history";

const STUDIO_TABS: ReadonlyArray<{ id: StudioTab; label: string }> = [
  { id: "output", label: "Content Output" },
  { id: "thumbnail", label: "Thumbnail Studio" },
  { id: "history", label: "History" },
];

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

const ADDITIONAL_CONTEXT_PLACEHOLDER = `Target audience:
Objective:
Angle:
Important points:
Tone:

Example:

Target:
Muslim usia 35-60

Objective:
Edukasi

Angle:
Menghilangkan ketakutan soal makanan halal di China

Tone:
Friendly dan tidak menggurui`;

const FREE_TOPIC_EXAMPLES = [
  "Perbedaan No Pork dan Halal",
  "Tips Packing Musim Dingin",
  "Kenapa Wisata Halal ke China Semakin Populer",
  "5 Kesalahan Jamaah Umroh Pemula",
];

function OutputSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ContentCopyButton text={content} />
      </div>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
        {content}
      </pre>
    </section>
  );
}

function StudioTabBar({
  activeTab,
  onChange,
}: {
  activeTab: StudioTab;
  onChange: (tab: StudioTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b bg-muted/20 p-2">
      {STUDIO_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function ContentStudioPanel({
  packages,
  initialHistory,
  initialThumbnailHistory,
  profiles,
  canManage,
}: ContentStudioPanelProps) {
  const [contentSource, setContentSource] =
    useState<ContentStudioSource>("package_based");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [goal, setGoal] = useState("lead_generation");
  const [pillar, setPillar] = useState("soft_sell");
  const [angle, setAngle] = useState("pain_point");
  const [generation, setGeneration] = useState<ContentStudioGeneration | null>(
    null,
  );
  const [history, setHistory] = useState(initialHistory);
  const [activeTab, setActiveTab] = useState<StudioTab>("output");
  const [boardGeneration, setBoardGeneration] =
    useState<ContentGenerationListItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPackageBased = contentSource === "package_based";
  const selectedPackage = packages.find((item) => item.id === packageId);
  const parsedPackage = useMemo(() => {
    if (!isPackageBased || !selectedPackage) {
      return null;
    }

    return parsePackageStructure({
      rawName: selectedPackage.name,
      destination: selectedPackage.destination,
      departureDate: null,
      durationDays: null,
    });
  }, [isPackageBased, selectedPackage]);

  const canGenerate =
    isPackageBased ? Boolean(packageId) : topic.trim().length > 0;

  const currentHistoryItem = generation
    ? history.find((item) => item.id === generation.id)
    : null;

  function handleGenerate() {
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.set("content_source", contentSource);
    formData.set("platform", platform);
    formData.set("goal", goal);
    formData.set("pillar", pillar);
    formData.set("angle", angle);
    formData.set("additional_context", additionalContext);

    if (isPackageBased) {
      formData.set("package_id", packageId);
    } else {
      formData.set("topic", topic);
    }

    startTransition(async () => {
      const response = await generateContentStudio(formData);

      if (!response.success || !response.data) {
        setError(response.message ?? "Gagal membuat konten.");
        return;
      }

      setGeneration(response.data);
      setActiveTab("output");
      setSuccessMessage("Konten berhasil dibuat dan disimpan ke history.");

      if (response.historyItem) {
        setHistory((current) => [
          response.historyItem!,
          ...current.filter((item) => item.id !== response.historyItem!.id),
        ]);
      }
    });
  }

  return (
    <>
      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div className="space-y-5 rounded-xl border p-5">
          <div>
            <h2 className="text-base font-semibold">Content Controls</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Atur source dan parameter, lalu generate.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Content Source</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONTENT_STUDIO_SOURCES.map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => {
                    setContentSource(source);
                    setGeneration(null);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    contentSource === source
                      ? getContentStudioSourceBadgeClassName(source)
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {getContentStudioSourceLabel(source)}
                </button>
              ))}
            </div>
          </div>

          {isPackageBased ? (
            packages.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Belum ada paket. Tambahkan di Packages atau gunakan Free Topic.
              </div>
            ) : (
              <div>
                <label htmlFor="package_id" className="text-sm font-medium">
                  Package
                </label>
                <select
                  id="package_id"
                  value={packageId}
                  onChange={(event) => setPackageId(event.target.value)}
                  className={inputClassName}
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                      {pkg.destination ? ` — ${pkg.destination}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )
          ) : (
            <div>
              <label htmlFor="topic" className="text-sm font-medium">
                Topic / Content Idea
              </label>
              <input
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Contoh: Perbedaan No Pork dan Halal"
                className={inputClassName}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {FREE_TOPIC_EXAMPLES.slice(0, 2).join(" · ")}...
              </p>
            </div>
          )}

          <div>
            <label htmlFor="platform" className="text-sm font-medium">
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className={inputClassName}
            >
              {CONTENT_PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="goal" className="text-sm font-medium">
              Goal
            </label>
            <select
              id="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className={inputClassName}
            >
              {CONTENT_STUDIO_GOALS.map((item) => (
                <option key={item} value={item}>
                  {getContentStudioGoalLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pillar" className="text-sm font-medium">
              Content Pillar
            </label>
            <select
              id="pillar"
              value={pillar}
              onChange={(event) => setPillar(event.target.value)}
              className={inputClassName}
            >
              {CONTENT_STUDIO_PILLARS.map((item) => (
                <option key={item} value={item}>
                  {getContentStudioPillarLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="angle" className="text-sm font-medium">
              Content Angle
            </label>
            <select
              id="angle"
              value={angle}
              onChange={(event) => setAngle(event.target.value)}
              className={inputClassName}
            >
              {CONTENT_STUDIO_ANGLES.map((item) => (
                <option key={item} value={item}>
                  {getContentStudioAngleLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="additional_context" className="text-sm font-medium">
              Additional Context
            </label>
            <textarea
              id="additional_context"
              value={additionalContext}
              onChange={(event) => setAdditionalContext(event.target.value)}
              rows={5}
              placeholder={ADDITIONAL_CONTEXT_PLACEHOLDER}
              className={inputClassName}
            />
          </div>

          {parsedPackage && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Struktur paket</p>
              <p className="mt-1">{parsedPackage.packageName}</p>
              <p className="mt-1">
                {parsedPackage.duration ?? "-"} ·{" "}
                {parsedPackage.destinations.join(", ") || "-"}
              </p>
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={handleGenerate}
            disabled={isPending || !canGenerate}
          >
            {isPending ? "Generating..." : "Generate"}
          </Button>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && (
            <p className="text-sm text-green-700">{successMessage}</p>
          )}
        </div>
      </aside>

      <div className="min-w-0 overflow-hidden rounded-xl border">
        <StudioTabBar activeTab={activeTab} onChange={setActiveTab} />

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4 sm:p-5">
          {activeTab === "output" && (
            <div className="space-y-4">
              {!generation ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm font-medium">Belum ada output</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Generate konten dari panel kiri untuk melihat ideas, hooks,
                    VO, caption, dan prompt di sini.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          getContentStudioSourceBadgeClassName(generation.source),
                        )}
                      >
                        {getContentStudioSourceLabel(generation.source)}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Output terbaru dari generation ini.
                      </p>
                    </div>
                    {canManage && currentHistoryItem && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setBoardGeneration(currentHistoryItem)}
                      >
                        Add to Content Board
                      </Button>
                    )}
                  </div>

                  <OutputSection
                    title="Ideas"
                    content={formatContentStudioList(
                      generation.result.contentIdeas,
                    )}
                  />
                  <OutputSection
                    title="Hooks"
                    content={formatContentStudioList(generation.result.hooks)}
                  />
                  <OutputSection
                    title="VO Script"
                    content={generation.result.voScript}
                  />
                  <OutputSection
                    title="Caption"
                    content={generation.result.caption}
                  />
                  <OutputSection title="CTA" content={generation.result.cta} />
                  <OutputSection
                    title="Thumbnail Concept"
                    content={generation.result.thumbnailConcept}
                  />
                  <OutputSection
                    title="Image Prompt"
                    content={generation.result.imagePrompt}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === "thumbnail" && (
            <div>
              {!generation ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm font-medium">Thumbnail Studio</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Generate content terlebih dahulu, lalu buat headline dan
                    thumbnail image di sini.
                  </p>
                </div>
              ) : (
                <ThumbnailStudioPanel
                  embedded
                  sourceHook={
                    generation.result.hooks[0] ??
                    generation.result.hooks.join("\n")
                  }
                  sourceVoScript={generation.result.voScript}
                  contentPillar={pillar}
                  contentAngle={angle}
                  aiContentGenerationId={generation.id}
                  initialHistory={initialThumbnailHistory}
                  canManage={canManage}
                  onImagesGenerated={() => setActiveTab("thumbnail")}
                />
              )}
            </div>
          )}

          {activeTab === "history" && (
            <ContentStudioHistory
              embedded
              history={history}
              profiles={profiles}
              canManage={canManage}
            />
          )}
        </div>
      </div>
      </div>

      {boardGeneration && (
        <AddToContentBoardModal
          generation={boardGeneration}
          profiles={profiles}
          onClose={() => setBoardGeneration(null)}
        />
      )}
    </>
  );
}

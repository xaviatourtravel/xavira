"use client";

import { useMemo, useState, useTransition } from "react";

import { generateContentStudio } from "@/app/(dashboard)/content/ai-actions";
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
    <div className="space-y-6">
      <div className="rounded-xl border p-6">
        <div>
          <h2 className="text-lg font-semibold">✨ AI Content Studio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate konten dari data paket atau topik bebas — siap untuk Reels
            dan Carousel.
          </p>
        </div>

        <div className="mt-6 space-y-6">
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
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
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
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Belum ada paket di database. Tambahkan paket di menu Packages
                atau gunakan mode Free Topic.
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
                Contoh topik: {FREE_TOPIC_EXAMPLES.join(" · ")}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="additional_context" className="text-sm font-medium">
              Additional Context
            </label>
            <textarea
              id="additional_context"
              value={additionalContext}
              onChange={(event) => setAdditionalContext(event.target.value)}
              rows={8}
              placeholder={ADDITIONAL_CONTEXT_PLACEHOLDER}
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </div>

        {parsedPackage && (
          <div className="mt-4 rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Struktur paket (internal)</p>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="uppercase tracking-wide">Package</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {parsedPackage.packageName}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Duration</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {parsedPackage.duration ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Departure</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {parsedPackage.departureMonth ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Destinations</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {parsedPackage.destinations.length > 0
                    ? parsedPackage.destinations.join(", ")
                    : "-"}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <Button
          type="button"
          className="mt-6"
          onClick={handleGenerate}
          disabled={isPending || !canGenerate}
        >
          {isPending ? "Generating..." : "Generate"}
        </Button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {successMessage && (
          <p className="mt-3 text-sm text-green-700">{successMessage}</p>
        )}
      </div>

      {generation && (
        <div className="space-y-4">
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
              Output dihasilkan dengan mode{" "}
              {getContentStudioSourceLabel(generation.source)}.
            </p>
          </div>

          <OutputSection
            title="Ideas"
            content={formatContentStudioList(generation.result.contentIdeas)}
          />
          <OutputSection
            title="Hooks"
            content={formatContentStudioList(generation.result.hooks)}
          />
          <OutputSection title="VO" content={generation.result.voScript} />
          <OutputSection title="Caption" content={generation.result.caption} />
          <OutputSection title="CTA" content={generation.result.cta} />
          <OutputSection
            title="Thumbnail"
            content={generation.result.thumbnailConcept}
          />
          <OutputSection
            title="Image Prompt"
            content={generation.result.imagePrompt}
          />

          <ThumbnailStudioPanel
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
          />
        </div>
      )}

      <ContentStudioHistory
        history={history}
        profiles={profiles}
        canManage={canManage}
      />
    </div>
  );
}

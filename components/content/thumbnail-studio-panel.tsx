"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import {
  generateThumbnailStudioCopy,
  generateThumbnailStudioImages,
  loadThumbnailAttachOptions,
} from "@/app/(dashboard)/content/thumbnail-actions";
import { AttachThumbnailModal } from "@/components/content/attach-thumbnail-modal";
import { ContentCopyButton } from "@/components/content/content-copy-button";
import { Button } from "@/components/ui/button";
import {
  getContentStudioAngleLabel,
  getContentStudioPillarLabel,
  isContentStudioAngle,
  isContentStudioPillar,
} from "@/lib/ai/content-studio";
import {
  formatThumbnailConcept,
  getThumbnailCoverFormatLabel,
  getThumbnailStylePresetLabel,
  THUMBNAIL_COVER_FORMATS,
  THUMBNAIL_STYLE_PRESETS,
  type ThumbnailCoverFormat,
  type ThumbnailStylePreset,
} from "@/lib/ai/thumbnail-studio";
import {
  formatThumbnailDateTime,
  type ThumbnailGenerationListItem,
} from "@/lib/content/thumbnail-queries";
import { cn } from "@/lib/utils";

type ThumbnailStudioPanelProps = {
  sourceHook: string;
  sourceVoScript: string;
  contentPillar: string;
  contentAngle: string;
  aiContentGenerationId?: string;
  initialHistory: ThumbnailGenerationListItem[];
  canManage: boolean;
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

function downloadImage(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function ThumbnailStudioPanel({
  sourceHook,
  sourceVoScript,
  contentPillar,
  contentAngle,
  aiContentGenerationId,
  initialHistory,
  canManage,
}: ThumbnailStudioPanelProps) {
  const [customHeadline, setCustomHeadline] = useState("");
  const [coverFormat, setCoverFormat] =
    useState<ThumbnailCoverFormat>("instagram_reels");
  const [stylePreset, setStylePreset] =
    useState<ThumbnailStylePreset>("premium_travel");
  const [activeGeneration, setActiveGeneration] =
    useState<ThumbnailGenerationListItem | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState("");
  const [selectedImageId, setSelectedImageId] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [attachTarget, setAttachTarget] = useState<ThumbnailGenerationListItem | null>(
    null,
  );
  const [contentOptions, setContentOptions] = useState<
    Awaited<ReturnType<typeof loadThumbnailAttachOptions>>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCopyPending, startCopyTransition] = useTransition();
  const [isImagePending, startImageTransition] = useTransition();

  const currentGeneration = activeGeneration;
  const resolvedHeadline =
    selectedHeadline ||
    currentGeneration?.selectedHeadline ||
    currentGeneration?.headlines[0] ||
    customHeadline;

  function applyGeneration(item: ThumbnailGenerationListItem) {
    setActiveGeneration(item);
    setSelectedHeadline(item.selectedHeadline ?? item.headlines[0] ?? "");
    setSelectedImageId(
      item.selectedImageId ?? item.imageVariations[0]?.id ?? "",
    );
  }

  function buildBaseFormData() {
    const formData = new FormData();
    formData.set("source_hook", sourceHook);
    formData.set("source_vo_script", sourceVoScript);
    formData.set("content_pillar", contentPillar);
    formData.set("content_angle", contentAngle);
    formData.set("cover_format", coverFormat);
    formData.set("style_preset", stylePreset);
    if (customHeadline) {
      formData.set("custom_headline", customHeadline);
    }
    if (aiContentGenerationId) {
      formData.set("ai_content_generation_id", aiContentGenerationId);
    }
    return formData;
  }

  function handleGenerateCopy() {
    setError(null);
    setSuccessMessage(null);

    startCopyTransition(async () => {
      const result = await generateThumbnailStudioCopy(buildBaseFormData());

      if (!result.success || !result.historyItem) {
        setError(result.message ?? "Gagal generate headline dan concept.");
        return;
      }

      setHistory((current) => [
        result.historyItem!,
        ...current.filter((item) => item.id !== result.historyItem!.id),
      ]);
      applyGeneration(result.historyItem);
      setSuccessMessage(result.message ?? "Headline dan concept berhasil dibuat.");
    });
  }

  function handleGenerateImages(generationOverride?: ThumbnailGenerationListItem) {
    const target = generationOverride ?? currentGeneration;

    if (!target) {
      setError("Generate headline dan concept terlebih dahulu.");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    const headline =
      generationOverride?.selectedHeadline ??
      selectedHeadline ??
      target.selectedHeadline ??
      target.headlines[0] ??
      customHeadline ??
      "";

    const formData = new FormData();
    formData.set("thumbnail_generation_id", target.id);
    if (headline) {
      formData.set("selected_headline", headline);
    }

    startImageTransition(async () => {
      const result = await generateThumbnailStudioImages(formData);

      if (!result.success || !result.historyItem) {
        setError(result.message ?? "Gagal generate thumbnail image.");
        return;
      }

      setHistory((current) =>
        current.map((item) =>
          item.id === result.historyItem!.id ? result.historyItem! : item,
        ),
      );
      applyGeneration(result.historyItem);
      setSuccessMessage(result.message ?? "Thumbnail images berhasil dibuat.");
    });
  }

  async function handleOpenAttach(item: ThumbnailGenerationListItem) {
    const options = await loadThumbnailAttachOptions();
    setContentOptions(options);
    setAttachTarget(item);
  }

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="space-y-6 rounded-xl border p-6">
        <div>
          <h2 className="text-lg font-semibold">Thumbnail Studio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate headline, concept, dan thumbnail image dari output Content
            Studio.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Generated Hook</label>
            <textarea
              readOnly
              value={sourceHook}
              rows={3}
              className={cn(inputClassName, "bg-muted/30")}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Generated VO Script</label>
            <textarea
              readOnly
              value={sourceVoScript}
              rows={3}
              className={cn(inputClassName, "bg-muted/30")}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Content Pillar</label>
            <input
              readOnly
              value={
                isContentStudioPillar(contentPillar)
                  ? getContentStudioPillarLabel(contentPillar)
                  : contentPillar
              }
              className={cn(inputClassName, "bg-muted/30")}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Content Angle</label>
            <input
              readOnly
              value={
                isContentStudioAngle(contentAngle)
                  ? getContentStudioAngleLabel(contentAngle)
                  : contentAngle
              }
              className={cn(inputClassName, "bg-muted/30")}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="custom_headline" className="text-sm font-medium">
              Custom Headline (optional)
            </label>
            <input
              id="custom_headline"
              value={customHeadline}
              onChange={(event) => setCustomHeadline(event.target.value)}
              className={inputClassName}
              placeholder="Override headline theme"
            />
          </div>
          <div>
            <label htmlFor="cover_format" className="text-sm font-medium">
              Cover Format
            </label>
            <select
              id="cover_format"
              value={coverFormat}
              onChange={(event) =>
                setCoverFormat(event.target.value as ThumbnailCoverFormat)
              }
              className={inputClassName}
            >
              {THUMBNAIL_COVER_FORMATS.map((value) => (
                <option key={value} value={value}>
                  {getThumbnailCoverFormatLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="style_preset" className="text-sm font-medium">
              Image Style Preset
            </label>
            <select
              id="style_preset"
              value={stylePreset}
              onChange={(event) =>
                setStylePreset(event.target.value as ThumbnailStylePreset)
              }
              className={inputClassName}
            >
              {THUMBNAIL_STYLE_PRESETS.map((value) => (
                <option key={value} value={value}>
                  {getThumbnailStylePresetLabel(value)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleGenerateCopy}
            disabled={isCopyPending || isImagePending}
          >
            {isCopyPending ? "Generating..." : "Generate Headlines & Concepts"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleGenerateImages()}
            disabled={
              !currentGeneration?.concept ||
              isCopyPending ||
              isImagePending
            }
          >
            {isImagePending ? "Generating Images..." : "Generate Thumbnail"}
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMessage && (
          <p className="text-sm text-green-700">{successMessage}</p>
        )}

        {currentGeneration && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <h3 className="text-sm font-semibold">Thumbnail Headlines</h3>
              <div className="mt-3 space-y-2">
                {currentGeneration.headlines.map((headline) => (
                  <label
                    key={headline}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                      resolvedHeadline === headline && "border-primary bg-primary/5",
                    )}
                  >
                    <input
                      type="radio"
                      name="selected_headline"
                      checked={resolvedHeadline === headline}
                      onChange={() => setSelectedHeadline(headline)}
                      className="mt-1"
                    />
                    <span className="text-sm">{headline}</span>
                  </label>
                ))}
              </div>
            </div>

            {currentGeneration.concept && (
              <section className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">Thumbnail Concept</h3>
                  <ContentCopyButton
                    text={formatThumbnailConcept(currentGeneration.concept)}
                  />
                </div>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                  {formatThumbnailConcept(currentGeneration.concept)}
                </pre>
              </section>
            )}

            {currentGeneration.imageVariations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold">AI Thumbnail Images</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {currentGeneration.imageVariations.map((image, index) => (
                    <div
                      key={image.id}
                      className={cn(
                        "overflow-hidden rounded-lg border",
                        selectedImageId === image.id && "ring-2 ring-primary",
                      )}
                    >
                      <button
                        type="button"
                        className="block w-full"
                        onClick={() => setSelectedImageId(image.id)}
                      >
                        <Image
                          src={image.publicUrl}
                          alt={`Thumbnail variation ${index + 1}`}
                          width={512}
                          height={910}
                          className="aspect-[9/16] w-full object-cover"
                          unoptimized
                        />
                      </button>
                      <div className="flex flex-wrap gap-2 p-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadImage(
                              image.publicUrl,
                              `thumbnail-${currentGeneration.id}-${index + 1}.png`,
                            )
                          }
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border p-6">
        <div>
          <h2 className="text-lg font-semibold">Thumbnail History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thumbnail generations tersimpan untuk download, regenerate, atau
            attach ke Content Board.
          </p>
        </div>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada thumbnail generation.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Headline</th>
                  <th className="px-3 py-2 font-medium">Style</th>
                  <th className="px-3 py-2 font-medium">Format</th>
                  <th className="px-3 py-2 font-medium">Preview</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatThumbnailDateTime(item.createdAt)}
                    </td>
                    <td className="max-w-xs px-3 py-3">{item.previewHeadline}</td>
                    <td className="px-3 py-3">{item.styleLabel}</td>
                    <td className="px-3 py-3">{item.coverFormatLabel}</td>
                    <td className="px-3 py-3">
                      {item.previewImageUrl ? (
                        <Image
                          src={item.previewImageUrl}
                          alt="Thumbnail preview"
                          width={48}
                          height={86}
                          className="h-16 w-9 rounded object-cover"
                          unoptimized
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => applyGeneration(item)}
                        >
                          Open
                        </Button>
                        {item.previewImageUrl && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              downloadImage(
                                item.previewImageUrl!,
                                `thumbnail-${item.id}.png`,
                              )
                            }
                          >
                            Download
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            applyGeneration(item);
                            handleGenerateImages(item);
                          }}
                          disabled={isImagePending}
                        >
                          Regenerate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenAttach(item)}
                          disabled={item.imageVariations.length === 0}
                        >
                          Add to Board
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {attachTarget && (
        <AttachThumbnailModal
          generationId={attachTarget.id}
          selectedHeadline={
            attachTarget.selectedHeadline ??
            attachTarget.headlines[0] ??
            attachTarget.sourceHook
          }
          selectedImageId={
            attachTarget.selectedImageId ??
            attachTarget.imageVariations[0]?.id ??
            ""
          }
          contentOptions={contentOptions}
          onClose={() => setAttachTarget(null)}
        />
      )}
    </>
  );
}

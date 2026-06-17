"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { createContentFromGeneration } from "@/app/(dashboard)/content/studio-actions";
import { Button } from "@/components/ui/button";
import {
  CONTENT_PLATFORM_OPTIONS,
  CONTENT_STATUS_OPTIONS,
  CONTENT_TYPE_OPTIONS,
} from "@/lib/content/constants";
import {
  buildDefaultContentBoardTitle,
  type ContentGenerationListItem,
} from "@/lib/content/generations";
import { mapContentStudioResultToSections } from "@/lib/content/ai-sections";

type AddToContentBoardModalProps = {
  generation: ContentGenerationListItem;
  profiles: ReadonlyArray<{ id: string; full_name: string | null }>;
  onClose: () => void;
  onSuccess?: (contentId: string) => void;
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export function AddToContentBoardModal({
  generation,
  profiles,
  onClose,
  onSuccess,
}: AddToContentBoardModalProps) {
  const previewSections = mapContentStudioResultToSections(generation.result);
  const [title, setTitle] = useState(
    buildDefaultContentBoardTitle(generation.subjectLabel, generation.result),
  );
  const [platform, setPlatform] = useState(generation.platform ?? "instagram");
  const [contentType, setContentType] = useState("reel");
  const [status, setStatus] = useState("idea");
  const [assignedTo, setAssignedTo] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("generation_id", generation.id);
    formData.set("title", title);
    formData.set("platform", platform);
    formData.set("content_type", contentType);
    formData.set("status", status);
    formData.set("assigned_to", assignedTo);
    formData.set("publish_date", publishDate);

    startTransition(async () => {
      const result = await createContentFromGeneration(formData);

      if (!result.success || !result.contentId) {
        setError(result.message ?? "Gagal menambahkan ke Content Board.");
        return;
      }

      setCreatedContentId(result.contentId);
      setSuccessMessage(result.message ?? "Konten berhasil ditambahkan.");
      onSuccess?.(result.contentId);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Tutup modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border bg-background shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-board-title"
      >
        <div className="border-b px-6 py-4">
          <h3 id="add-to-board-title" className="text-lg font-semibold">
            Tambahkan ke Content Board
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat task content board dari generation ini. Konten AI tetap
            tersimpan di generation source — tidak diduplikasi ke Notes.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview konten AI
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-medium">Hook</dt>
                <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {previewSections.hook}
                </dd>
              </div>
              <div>
                <dt className="font-medium">VO Script</dt>
                <dd className="mt-1 line-clamp-6 whitespace-pre-wrap text-muted-foreground">
                  {previewSections.voScript}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Caption</dt>
                <dd className="mt-1 line-clamp-4 whitespace-pre-wrap text-muted-foreground">
                  {previewSections.caption}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <label htmlFor="board_title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="board_title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="board_platform" className="text-sm font-medium">
                Platform
              </label>
              <select
                id="board_platform"
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
              <label htmlFor="board_content_type" className="text-sm font-medium">
                Content Type
              </label>
              <select
                id="board_content_type"
                value={contentType}
                onChange={(event) => setContentType(event.target.value)}
                className={inputClassName}
              >
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="board_status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="board_status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClassName}
            >
              {CONTENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="board_assigned_to" className="text-sm font-medium">
              Assigned To
            </label>
            <select
              id="board_assigned_to"
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              className={inputClassName}
            >
              <option value="">Belum ditugaskan</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name || "Pengguna"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="board_publish_date" className="text-sm font-medium">
              Publish Date
            </label>
            <input
              id="board_publish_date"
              type="date"
              value={publishDate}
              onChange={(event) => setPublishDate(event.target.value)}
              className={inputClassName}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
              {createdContentId && (
                <div className="mt-2">
                  <Link
                    href={`/content/${createdContentId}`}
                    className="font-medium underline"
                  >
                    Buka content board item
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
            {!createdContentId && (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Tambahkan ke Board"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

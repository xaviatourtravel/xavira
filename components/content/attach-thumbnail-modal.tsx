"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { attachThumbnailToContentBoard } from "@/app/(dashboard)/content/thumbnail-actions";
import { Button } from "@/components/ui/button";
import { formatContentPlatformLabel, formatContentStatusLabel } from "@/lib/content/constants";

type ContentOption = {
  id: string;
  title: string;
  status: string;
  platform: string;
};

type AttachThumbnailModalProps = {
  generationId: string;
  selectedHeadline: string;
  selectedImageId: string;
  contentOptions: ContentOption[];
  onClose: () => void;
  onSuccess?: (contentId: string) => void;
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export function AttachThumbnailModal({
  generationId,
  selectedHeadline,
  selectedImageId,
  contentOptions,
  onClose,
  onSuccess,
}: AttachThumbnailModalProps) {
  const [contentId, setContentId] = useState(contentOptions[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [attachedContentId, setAttachedContentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!contentId) {
      setError("Pilih content board item terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.set("content_id", contentId);
    formData.set("thumbnail_generation_id", generationId);
    formData.set("selected_headline", selectedHeadline);
    formData.set("selected_image_id", selectedImageId);

    startTransition(async () => {
      const result = await attachThumbnailToContentBoard(formData);

      if (!result.success || !result.contentId) {
        setError(result.message ?? "Gagal attach thumbnail.");
        return;
      }

      setAttachedContentId(result.contentId);
      setSuccessMessage(result.message ?? "Thumbnail berhasil ditambahkan.");
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
        className="relative z-10 w-full max-w-lg rounded-lg border bg-background shadow-lg"
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Add to Content Board</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Attach thumbnail image dan headline ke content board item yang sudah
            ada.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div>
            <label htmlFor="attach_content_id" className="text-sm font-medium">
              Content Board Item
            </label>
            <select
              id="attach_content_id"
              value={contentId}
              onChange={(event) => setContentId(event.target.value)}
              className={inputClassName}
              required
            >
              {contentOptions.length === 0 ? (
                <option value="">Belum ada content board item</option>
              ) : (
                contentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} · {formatContentPlatformLabel(item.platform)} ·{" "}
                    {formatContentStatusLabel(item.status)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Selected Headline</p>
            <p className="mt-1 text-muted-foreground">{selectedHeadline}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
              {attachedContentId && (
                <div className="mt-2">
                  <Link
                    href={`/content/${attachedContentId}`}
                    className="font-medium underline"
                  >
                    Buka content board item
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
            {!attachedContentId && contentOptions.length > 0 && (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Attach Thumbnail"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

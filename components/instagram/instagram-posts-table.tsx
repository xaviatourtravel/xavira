"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  fetchLinkableInstagramContents,
  fetchSuggestedContentMatchesForMedia,
  linkInstagramPostToContent,
  unlinkInstagramPostFromContent,
} from "@/app/(dashboard)/content/instagram-link-actions";
import { buttonVariants } from "@/components/ui/button";
import {
  computeDisplayedEngagement,
  formatInstagramMetricValue,
} from "@/lib/instagram/insights-display";
import type { InstagramTopPostRow } from "@/lib/instagram/metrics";
import { cn } from "@/lib/utils";

type LinkableContent = {
  id: string;
  title: string;
  publishDate: string | null;
  status: string;
};

type SuggestedMatch = {
  contentId: string;
  title: string;
  publishDate: string | null;
  score: number;
  reasons: string[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function truncateCaption(value: string | null, max = 80) {
  if (!value) {
    return "Tanpa caption";
  }

  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function InstagramPostLinkCell({
  row,
  canLink,
}: {
  row: InstagramTopPostRow;
  canLink: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedMatch[]>([]);
  const [linkableContents, setLinkableContents] = useState<LinkableContent[]>(
    [],
  );

  async function loadLinkData() {
    const [nextSuggestions, nextContents] = await Promise.all([
      fetchSuggestedContentMatchesForMedia(row.instagramMediaId),
      fetchLinkableInstagramContents(row.instagramMediaId),
    ]);
    setSuggestions(nextSuggestions);
    setLinkableContents(nextContents);
  }

  function runAction(action: () => Promise<{ success: boolean; message?: string }>) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setMessage(result.message ?? "Berhasil.");
        setIsOpen(false);
        router.refresh();
        return;
      }

      setError(result.message ?? "Gagal memproses permintaan.");
    });
  }

  function handleLink(contentId: string) {
    const formData = new FormData();
    formData.set("content_id", contentId);
    formData.set("instagram_media_id", row.instagramMediaId);
    runAction(() => linkInstagramPostToContent(formData));
  }

  function handleUnlink() {
    const formData = new FormData();
    formData.set("instagram_media_id", row.instagramMediaId);
    if (row.contentId) {
      formData.set("content_id", row.contentId);
    }
    runAction(() => unlinkInstagramPostFromContent(formData));
  }

  if (row.contentId) {
    return (
      <div className="space-y-1">
        <Link
          href={`/content/${row.contentId}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.contentTitle ?? "Content Board"}
        </Link>
        {canLink ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleUnlink}
            className="block text-xs text-muted-foreground hover:text-foreground"
          >
            Putuskan hubungan
          </button>
        ) : null}
      </div>
    );
  }

  if (!canLink) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) {
            startTransition(async () => {
              await loadLinkData();
            });
          }
        }}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Hubungkan
      </button>

      {isOpen ? (
        <div className="mt-2 w-72 rounded-lg border bg-background p-3 shadow-sm">
          {message ? (
            <p className="mb-2 text-xs text-green-700">{message}</p>
          ) : null}
          {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}

          {suggestions.length > 0 ? (
            <div className="mb-3 space-y-2">
              <p className="text-xs font-medium">Saran</p>
              {suggestions.map((item) => (
                <div key={item.contentId} className="rounded border p-2">
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.reasons.join(" · ")}
                  </p>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleLink(item.contentId)}
                    className="mt-1 text-xs text-blue-600 hover:underline"
                  >
                    Hubungkan
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">
              Pilih content
            </span>
            <select
              value={selectedContentId}
              onChange={(event) => setSelectedContentId(event.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              disabled={isPending}
            >
              <option value="">Pilih…</option>
              {linkableContents.map((content) => (
                <option key={content.id} value={content.id}>
                  {content.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={isPending || !selectedContentId}
            onClick={() => handleLink(selectedContentId)}
            className={cn(buttonVariants({ size: "sm" }), "mt-2 w-full")}
          >
            Simpan
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function InstagramPostsTable({
  rows,
  insightsGranted,
  canLink,
}: {
  rows: InstagramTopPostRow[];
  insightsGranted: boolean;
  canLink: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada data post. Sinkronisasi Instagram untuk memuat analytics.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Post</th>
            <th className="px-4 py-3 font-medium">Content Board</th>
            <th className="px-4 py-3 font-medium">Pillar</th>
            <th className="px-4 py-3 text-right font-medium">Likes</th>
            <th className="px-4 py-3 text-right font-medium">Comments</th>
            <th className="px-4 py-3 text-right font-medium">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.instagramMediaId} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <p className="font-medium leading-snug">
                  {truncateCaption(row.caption)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(row.postedAt)}
                </p>
                {row.permalink ? (
                  <a
                    href={row.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                  >
                    Lihat di IG
                  </a>
                ) : null}
              </td>
              <td className="px-4 py-3 align-top">
                <InstagramPostLinkCell row={row} canLink={canLink} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.contentPillarLabel ?? "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(row.likes)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(row.comments)}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-700">
                {formatInstagramMetricValue(
                  computeDisplayedEngagement(row, insightsGranted),
                  insightsGranted,
                  "likes",
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  fetchSuggestedInstagramMatchesForContent,
  fetchUnlinkedInstagramPosts,
  linkInstagramPostToContent,
  unlinkInstagramPostFromContent,
} from "@/app/(dashboard)/content/instagram-link-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SuggestedMatch = {
  instagramMediaId: string;
  caption: string | null;
  permalink: string | null;
  postedAt: string | null;
  score: number;
  reasons: string[];
};

type UnlinkedPost = {
  instagramMediaId: string;
  caption: string | null;
  permalink: string | null;
  postedAt: string | null;
};

type ContentInstagramLinkPanelProps = {
  contentId: string;
  contentTitle: string;
  instagramMediaId: string | null;
  canLink: boolean;
  initialSuggestions: SuggestedMatch[];
  initialUnlinkedPosts: UnlinkedPost[];
};

function truncateCaption(value: string | null, max = 60) {
  if (!value) {
    return "Tanpa caption";
  }

  return value.length > max ? `${value.slice(0, max)}…` : value;
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

export function ContentInstagramLinkPanel({
  contentId,
  contentTitle,
  instagramMediaId,
  canLink,
  initialSuggestions,
  initialUnlinkedPosts,
}: ContentInstagramLinkPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [unlinkedPosts, setUnlinkedPosts] = useState(initialUnlinkedPosts);

  function runAction(action: () => Promise<{ success: boolean; message?: string }>) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setMessage(result.message ?? "Berhasil.");
        router.refresh();
        return;
      }

      setError(result.message ?? "Gagal memproses permintaan.");
    });
  }

  function handleLink(mediaId: string) {
    const formData = new FormData();
    formData.set("content_id", contentId);
    formData.set("instagram_media_id", mediaId);
    runAction(() => linkInstagramPostToContent(formData));
  }

  function handleUnlink() {
    const formData = new FormData();
    formData.set("content_id", contentId);
    if (instagramMediaId) {
      formData.set("instagram_media_id", instagramMediaId);
    }
    runAction(() => unlinkInstagramPostFromContent(formData));
  }

  async function refreshSuggestions() {
    const [nextSuggestions, nextPosts] = await Promise.all([
      fetchSuggestedInstagramMatchesForContent(contentId),
      fetchUnlinkedInstagramPosts(),
    ]);
    setSuggestions(nextSuggestions);
    setUnlinkedPosts(nextPosts);
  }

  if (!canLink) {
    return null;
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-base font-semibold">Hubungkan ke Post Instagram</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cocokkan &quot;{contentTitle}&quot; dengan post yang tersinkronisasi dari
        Instagram Analytics.
      </p>

      {message ? (
        <p className="mt-3 text-sm text-green-700">{message}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {instagramMediaId ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Sudah terhubung ke post Instagram.
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleUnlink}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Putuskan hubungan
          </button>
        </div>
      ) : (
        <>
          {suggestions.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Saran kecocokan</p>
              {suggestions.map((item) => (
                <div
                  key={item.instagramMediaId}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {truncateCaption(item.caption)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(item.postedAt)} · Skor {item.score}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.reasons.join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleLink(item.instagramMediaId)}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Hubungkan
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Atau pilih manual</p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[240px] flex-1 text-sm">
                <span className="mb-1 block text-muted-foreground">
                  Post Instagram
                </span>
                <select
                  value={selectedMediaId}
                  onChange={(event) => setSelectedMediaId(event.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2"
                  disabled={isPending}
                >
                  <option value="">Pilih post…</option>
                  {unlinkedPosts.map((post) => (
                    <option
                      key={post.instagramMediaId}
                      value={post.instagramMediaId}
                    >
                      {truncateCaption(post.caption, 40)} ({formatDate(post.postedAt)})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={isPending || !selectedMediaId}
                onClick={() => handleLink(selectedMediaId)}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Hubungkan
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await refreshSuggestions();
                  });
                }}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

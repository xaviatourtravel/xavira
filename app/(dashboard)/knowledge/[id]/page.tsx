import Link from "next/link";
import { notFound } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CategoryBadge } from "@/components/knowledge/category-badge";
import { KnowledgeAiOutput } from "@/components/knowledge/knowledge-ai-output";
import { KnowledgeDeleteButton } from "@/components/knowledge/knowledge-delete-button";
import { KnowledgeFileDownload } from "@/components/knowledge/knowledge-file-download";
import { reprocessKnowledgeEntry } from "@/app/(dashboard)/knowledge/actions";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadKnowledgeEntryById } from "@/lib/knowledge/queries";
import { createClient } from "@/utils/supabase/server";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const canManage = isAdminOrOwner(profile);
  const supabase = await createClient();

  const entry = await loadKnowledgeEntryById(supabase, profile.organization_id, id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <Link
          href="/knowledge"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Kembali ke Knowledge Hub
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <CategoryBadge category={entry.category} />
          <h1 className="text-3xl font-bold">{entry.title}</h1>
          <p className="text-sm text-muted-foreground">
            Diperbarui {formatDateTime(entry.updatedAt)}
          </p>
          {entry.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {entry.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/knowledge?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {entry.filePath ? (
            <KnowledgeFileDownload entryId={entry.id} fileName={entry.fileName} />
          ) : null}
          {canManage ? (
            <>
              <form action={reprocessKnowledgeEntry}>
                <input type="hidden" name="entry_id" value={entry.id} />
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Proses ulang AI
                </button>
              </form>
              <Link
                href={`/knowledge/${entry.id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Edit
              </Link>
              <KnowledgeDeleteButton entryId={entry.id} />
            </>
          ) : null}
        </div>
      </div>

      <KnowledgeAiOutput
        aiStatus={entry.aiStatus}
        summary={entry.summary}
        keyPoints={entry.keyPoints}
        faq={entry.faq}
      />

      <div className="rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Konten</h2>
          {entry.fileName ? (
            <span className="text-xs text-muted-foreground">
              Sumber: {entry.fileName}
            </span>
          ) : null}
        </div>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {entry.content || "Tidak ada konten."}
        </div>
      </div>
    </div>
  );
}

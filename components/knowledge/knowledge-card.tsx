import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/knowledge/category-badge";
import { formatKnowledgeAiStatusLabel } from "@/lib/knowledge/constants";
import type { KnowledgeEntryListItem } from "@/lib/knowledge/queries";

function aiStatusClass(status: string) {
  switch (status) {
    case "completed":
      return "text-green-700";
    case "failed":
      return "text-red-600";
    case "processing":
      return "text-amber-600";
    default:
      return "text-muted-foreground";
  }
}

export function KnowledgeCard({ entry }: { entry: KnowledgeEntryListItem }) {
  return (
    <Link
      href={`/knowledge/${entry.id}`}
      className="flex flex-col gap-3 rounded-xl border p-5 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <CategoryBadge category={entry.category} />
        {entry.sourceType === "upload" ? (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : null}
      </div>

      <div>
        <h3 className="font-semibold leading-snug">{entry.title}</h3>
        {entry.summary ? (
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
            {entry.summary}
          </p>
        ) : (
          <p className="mt-1 text-sm italic text-muted-foreground">
            Belum ada ringkasan AI.
          </p>
        )}
      </div>

      {entry.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-1.5 text-xs">
        <Sparkles className={cn("h-3.5 w-3.5", aiStatusClass(entry.aiStatus))} />
        <span className={aiStatusClass(entry.aiStatus)}>
          {formatKnowledgeAiStatusLabel(entry.aiStatus)}
        </span>
      </div>
    </Link>
  );
}

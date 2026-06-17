import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { KnowledgeCard } from "@/components/knowledge/knowledge-card";
import { KnowledgeFiltersBar } from "@/components/knowledge/knowledge-filters";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  loadKnowledgeEntries,
  loadKnowledgeTagCloud,
  parseKnowledgeFilters,
} from "@/lib/knowledge/queries";
import { createClient } from "@/utils/supabase/server";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canManage = isAdminOrOwner(profile);
  const supabase = await createClient();

  const filters = parseKnowledgeFilters(params);

  const [entries, tagCloud] = await Promise.all([
    loadKnowledgeEntries(supabase, profile.organization_id, filters),
    loadKnowledgeTagCloud(supabase, profile.organization_id),
  ]);

  const isFiltered = Boolean(filters.category || filters.tag || filters.query);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Hub</h1>
          <p className="text-muted-foreground">
            Pusat pengetahuan perusahaan yang menjadi konteks untuk semua fitur AI.
          </p>
        </div>
        {canManage ? (
          <Link href="/knowledge/new" className={cn(buttonVariants())}>
            Tambah Knowledge
          </Link>
        ) : null}
      </div>

      {params.error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <KnowledgeFiltersBar
        category={filters.category}
        query={filters.query}
        tag={filters.tag}
        tagCloud={tagCloud}
      />

      {entries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <KnowledgeCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {isFiltered
              ? "Tidak ada knowledge yang cocok dengan filter."
              : "Belum ada knowledge entry. Mulai dengan menambahkan dokumen atau catatan."}
          </p>
          {canManage && !isFiltered ? (
            <Link
              href="/knowledge/new"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Tambah Knowledge Pertama
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

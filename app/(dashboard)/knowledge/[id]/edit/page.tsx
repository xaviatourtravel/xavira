import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { KnowledgeFormFields } from "@/components/knowledge/knowledge-form-fields";
import { updateKnowledgeEntry } from "@/app/(dashboard)/knowledge/actions";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { formatKnowledgeTagsInput } from "@/lib/knowledge/constants";
import { loadKnowledgeEntryById } from "@/lib/knowledge/queries";
import { createClient } from "@/utils/supabase/server";

export default async function EditKnowledgePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const queryParams = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/knowledge?error=Hanya admin atau owner yang dapat mengubah knowledge.");
  }

  const supabase = await createClient();
  const entry = await loadKnowledgeEntryById(supabase, profile.organization_id, id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Knowledge</h1>
        <p className="text-muted-foreground">
          Perbarui konten knowledge. Gunakan &quot;Proses ulang AI&quot; di halaman
          detail untuk menyegarkan ringkasan setelah perubahan besar.
        </p>
      </div>

      {queryParams.error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(queryParams.error)}
        </div>
      ) : null}

      <form
        action={updateKnowledgeEntry}
        className="space-y-5 rounded-lg border p-6"
      >
        <input type="hidden" name="entry_id" value={entry.id} />
        <KnowledgeFormFields
          contentRequired
          defaultValues={{
            title: entry.title,
            category: entry.category,
            tags: formatKnowledgeTagsInput(entry.tags),
            content: entry.content,
          }}
        />

        <div className="flex items-center gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Perubahan
          </button>
          <Link
            href={`/knowledge/${entry.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

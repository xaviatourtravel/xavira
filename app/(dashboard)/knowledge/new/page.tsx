import Link from "next/link";
import { redirect } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { KnowledgeFormFields } from "@/components/knowledge/knowledge-form-fields";
import { createKnowledgeEntry } from "@/app/(dashboard)/knowledge/actions";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";

export default async function NewKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/knowledge?error=Hanya admin atau owner yang dapat menambah knowledge.");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tambah Knowledge</h1>
        <p className="text-muted-foreground">
          Buat entry baru atau unggah dokumen. AI akan otomatis membuat ringkasan,
          poin penting, dan FAQ.
        </p>
      </div>

      {params.error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <form
        action={createKnowledgeEntry}
        className="space-y-5 rounded-lg border p-6"
      >
        <KnowledgeFormFields showFileUpload />

        <div className="flex items-center gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan & Proses AI
          </button>
          <Link
            href="/knowledge"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Pemrosesan AI berjalan saat menyimpan, sehingga mungkin butuh beberapa
          detik untuk dokumen besar.
        </p>
      </form>
    </div>
  );
}

import Link from "next/link";

import { ContentBoard } from "@/components/content/content-board";
import { buttonVariants } from "@/components/ui/button";
import type { ContentBoardItem } from "@/lib/content/queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canManageContent = isAdminOrOwner(profile);
  const supabase = await createClient();

  const { data: contents, error } = await supabase
    .from("contents")
    .select(
      `
      id,
      title,
      platform,
      content_type,
      status,
      publish_date,
      assigned_to,
      campaigns (
        name
      ),
      profiles!contents_assigned_to_fkey (
        full_name
      )
    `,
    )
    .eq("organization_id", profile.organization_id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat content board.");
  }

  const items = (contents ?? []) as ContentBoardItem[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content Board</h1>
          <p className="text-sm text-muted-foreground">
            {canManageContent
              ? "Kelola alur kerja konten media dari ide hingga published."
              : "Lihat alur kerja konten media tim Anda."}
          </p>
        </div>

        {canManageContent && (
          <Link href="/content/new" className={cn(buttonVariants())}>
            New Content
          </Link>
        )}
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Belum ada content</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {canManageContent
              ? "Mulai dengan content pertama untuk tim media."
              : "Belum ada content di board organisasi Anda."}
          </p>
          {canManageContent && (
            <Link
              href="/content/new"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              New Content
            </Link>
          )}
        </div>
      ) : (
        <ContentBoard items={items} />
      )}
    </div>
  );
}

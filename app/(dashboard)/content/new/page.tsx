import Link from "next/link";
import { redirect } from "next/navigation";

import { createContent } from "../actions";
import { ContentFormFields } from "@/components/content/content-form-fields";
import { buttonVariants } from "@/components/ui/button";
import { getOrgCampaignOptions } from "@/lib/campaigns/queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/content?error=Hanya admin atau owner yang dapat menambah content.",
    );
  }

  const supabase = await createClient();
  const [campaigns, { data: orgProfiles }] = await Promise.all([
    getOrgCampaignOptions(supabase, profile.organization_id),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/content"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali ke Content Board
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New Content</h1>
        <p className="text-sm text-muted-foreground">
          Tambahkan task content baru untuk tim media.
        </p>
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createContent} className="space-y-5 rounded-lg border p-6">
        <ContentFormFields
          campaigns={campaigns}
          profiles={orgProfiles ?? []}
        />

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Content
          </button>

          <Link
            href="/content"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

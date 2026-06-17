import Link from "next/link";
import { redirect } from "next/navigation";

import { ContentStudioPanel } from "@/components/content/content-studio-panel";
import { buttonVariants } from "@/components/ui/button";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadRecentContentGenerations } from "@/lib/content/generation-queries";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type PackageOption = {
  id: string;
  name: string;
  destination: string | null;
};

export default async function ContentStudioPage() {
  const { profile } = await requireProfile();
  const canManage = isAdminOrOwner(profile);

  if (!canManage) {
    redirect(
      `/content?error=${encodeURIComponent("Hanya owner atau admin yang dapat mengakses AI Content Studio.")}`,
    );
  }

  const supabase = await createClient();

  const [
    { data: packages, error: packagesError },
    history,
    { data: orgProfiles, error: profilesError },
  ] = await Promise.all([
    supabase
      .from("packages")
      .select("id, name, destination")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true }),
    loadRecentContentGenerations(supabase, profile.organization_id),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
  ]);

  if (packagesError || profilesError) {
    throw new Error("Gagal memuat data Content Studio.");
  }

  const packageOptions = (packages ?? []) as PackageOption[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/content"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Kembali ke Content Board
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">AI Content Studio</h1>
          <p className="text-sm text-muted-foreground">
            Buat ide konten dari data paket atau topik bebas — hooks, VO,
            caption, dan visual prompt siap publish.
          </p>
        </div>

        <Link href="/packages" className={cn(buttonVariants({ variant: "outline" }))}>
          Kelola Paket
        </Link>
      </div>

      <ContentStudioPanel
        packages={packageOptions}
        initialHistory={history}
        profiles={orgProfiles ?? []}
        canManage={canManage}
      />
    </div>
  );
}

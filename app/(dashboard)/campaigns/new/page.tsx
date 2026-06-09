import Link from "next/link";
import { redirect } from "next/navigation";

import { createCampaign } from "../actions";
import { CampaignFormFields } from "@/components/campaigns/campaign-form-fields";
import { buttonVariants } from "@/components/ui/button";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/campaigns?error=Hanya admin atau owner yang dapat menambah campaign.",
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Campaign Baru</h1>
        <p className="text-sm text-muted-foreground">
          Buat campaign attribution untuk melacak sumber lead dan performa
          penjualan.
        </p>
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createCampaign} className="space-y-5 rounded-lg border p-6">
        <CampaignFormFields />

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Campaign
          </button>

          <Link
            href="/campaigns"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

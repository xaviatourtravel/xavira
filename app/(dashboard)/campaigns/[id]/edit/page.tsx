import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateCampaign } from "../../actions";
import { CampaignFormFields } from "@/components/campaigns/campaign-form-fields";
import { buttonVariants } from "@/components/ui/button";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type CampaignEdit = {
  id: string;
  name: string;
  source: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  notes: string | null;
};

export default async function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/campaigns?error=Hanya admin atau owner yang dapat mengubah campaign.",
    );
  }

  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, source, status, start_date, end_date, budget, notes",
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat data campaign.");
  }

  if (!campaign) {
    notFound();
  }

  const detail = campaign as CampaignEdit;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/campaigns/${detail.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali ke Detail Campaign
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit Campaign</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui data campaign {detail.name}.
        </p>
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={updateCampaign} className="space-y-5 rounded-lg border p-6">
        <input type="hidden" name="campaign_id" value={detail.id} />

        <CampaignFormFields
          defaultValues={{
            name: detail.name,
            source: detail.source ?? "other",
            status: detail.status,
            startDate: detail.start_date,
            endDate: detail.end_date,
            budget: detail.budget,
            notes: detail.notes,
          }}
        />

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Perubahan
          </button>

          <Link
            href={`/campaigns/${detail.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

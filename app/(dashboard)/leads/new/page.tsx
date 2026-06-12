import { createLead } from "../actions";
import { LeadForm } from "@/components/leads/lead-form";
import { loadLeadFormOptions } from "@/lib/leads/load-lead-form-options";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const formOptions = await loadLeadFormOptions(
    supabase,
    profile.organization_id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tambah Lead</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan data calon jamaah atau calon peserta tour.
        </p>
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <LeadForm
        mode="create"
        action={createLead}
        profile={profile}
        options={formOptions}
        cancelHref="/leads"
      />
    </div>
  );
}

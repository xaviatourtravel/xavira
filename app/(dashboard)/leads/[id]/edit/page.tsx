import { notFound } from "next/navigation";

import { updateLead } from "../actions";
import { LeadForm } from "@/components/leads/lead-form";
import { canEditLead } from "@/lib/leads/permissions";
import { loadLeadFormOptions } from "@/lib/leads/load-lead-form-options";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function EditLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, organization_id, full_name, whatsapp_number, email, source, package_interest, status, budget_idr, travel_date_preference, party_size, notes, assigned_to, campaign_id, lead_date, lead_temperature",
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat data lead.");
  }

  if (!lead || !canEditLead(profile, lead)) {
    notFound();
  }

  const formOptions = await loadLeadFormOptions(
    supabase,
    profile.organization_id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Lead</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui data {lead.full_name}.
        </p>
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <LeadForm
        mode="edit"
        action={updateLead}
        profile={profile}
        options={formOptions}
        leadId={lead.id}
        cancelHref={`/leads/${lead.id}`}
        values={{
          full_name: lead.full_name,
          whatsapp_number: lead.whatsapp_number,
          email: lead.email,
          source: lead.source,
          lead_date: lead.lead_date,
          package_interest: lead.package_interest,
          status: lead.status,
          assigned_to: lead.assigned_to,
          campaign_id: lead.campaign_id,
          budget_idr: lead.budget_idr,
          party_size: lead.party_size,
          travel_date_preference: lead.travel_date_preference,
          notes: lead.notes,
          lead_temperature: lead.lead_temperature,
        }}
        className="rounded-lg border p-6"
      />
    </div>
  );
}

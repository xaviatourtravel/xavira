"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { auditFromProfile } from "@/lib/audit";
import { requireProfile } from "@/lib/auth/session";
import { createAutomaticFirstFollowUpTask } from "@/lib/leads/first-follow-up";
import {
  buildLeadsActionRedirectPath,
  formatBulkDeleteFailureMessage,
  parseLeadIds,
} from "@/lib/leads/bulk-delete";
import { parseLeadFormFields, getLeadFormString } from "@/lib/leads/lead-form-parsing";
import { canEditLead } from "@/lib/leads/permissions";
import { parseLeadTemperatureInput } from "@/lib/leads/lead-temperature";
import { resolveCampaignIdForOrganization } from "@/lib/campaigns/queries";
import { encodeActionError, formatActionError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";

export async function createLead(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const fields = parseLeadFormFields(formData);

  if (!fields.fullName) {
    redirect("/leads/new?error=Nama wajib diisi");
  }

  const campaignId = await resolveCampaignIdForOrganization(
    supabase,
    profile.organization_id,
    fields.campaignIdInput,
  );

  if (fields.campaignIdInput && !campaignId) {
    redirect("/leads/new?error=Campaign tidak valid");
  }

  let assignedTo = fields.assignedTo;
  if (!isAdminOrOwner(profile)) {
    assignedTo = profile.id;
  } else if (assignedTo) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!assignee) {
      redirect("/leads/new?error=Assignee tidak valid");
    }
  }

  const { data: createdLead, error } = await supabase
    .from("leads")
    .insert({
      organization_id: profile.organization_id,
      full_name: fields.fullName,
      whatsapp_number: fields.whatsappNumber || null,
      phone: fields.whatsappNumber || null,
      email: fields.email || null,
      source: fields.source,
      package_interest: fields.packageInterest || null,
      notes: fields.notes || null,
      campaign_id: campaignId,
      lead_date: fields.leadDateForCreate,
      status: fields.status,
      priority: "medium",
      interest_type: "halal_tour",
      budget_idr: fields.budgetIdr,
      travel_date_preference: fields.travelDatePreference || null,
      party_size: fields.partySize,
      assigned_to: assignedTo || null,
      lead_temperature: fields.leadTemperature,
    })
    .select("id")
    .single();

  if (error || !createdLead) {
    redirect(
      `/leads/new?error=${encodeActionError(error ?? "Gagal membuat lead", "createLead")}`,
    );
  }

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: createdLead.id,
    actor_id: profile.id,
    activity_type: "note",
    title: "Lead dibuat",
    body: `Lead ${fields.fullName} ditambahkan ke CRM.`,
  });

  await createAutomaticFirstFollowUpTask(supabase, profile, createdLead.id);

  await auditFromProfile(supabase, profile, {
    action: "lead_created",
    entityType: "lead",
    entityId: createdLead.id,
    entityLabel: fields.fullName,
    metadata: {
      source: fields.source,
      status: fields.status,
    },
  });

  revalidatePath("/leads");
  redirect("/leads");
}

export async function updateLeadTemperature(
  leadId: string,
  temperatureInput: string,
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  if (!leadId) {
    return { error: "Lead tidak ditemukan" };
  }

  const { data: existingLead, error: lookupError } = await supabase
    .from("leads")
    .select("id, assigned_to, organization_id")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) {
    return { error: formatActionError(lookupError, "updateLeadTemperature") };
  }

  if (!existingLead || !canEditLead(profile, existingLead)) {
    return { error: "Anda tidak memiliki izin untuk mengubah lead ini." };
  }

  const leadTemperature = parseLeadTemperatureInput(temperatureInput);

  const { error } = await supabase
    .from("leads")
    .update({ lead_temperature: leadTemperature })
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null);

  if (error) {
    return { error: formatActionError(error, "updateLeadTemperature") };
  }

  revalidatePath("/leads");
  return { ok: true };
}

export async function bulkDeleteLeads(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      buildLeadsActionRedirectPath(
        getLeadFormString(formData, "return_to") || "/leads",
        "error",
        "Hanya admin atau owner yang dapat menghapus lead.",
      ),
    );
  }

  const returnTo = getLeadFormString(formData, "return_to") || "/leads";
  const leadIds = parseLeadIds(formData.getAll("lead_ids"));

  if (leadIds.length === 0) {
    redirect(
      buildLeadsActionRedirectPath(
        returnTo,
        "error",
        "Pilih minimal satu lead untuk dihapus.",
      ),
    );
  }

  const supabase = await createClient();

  const { data: orgLeads, error: lookupError } = await supabase
    .from("leads")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .in("id", leadIds);

  if (lookupError) {
    redirect(
      buildLeadsActionRedirectPath(
        returnTo,
        "error",
        formatActionError(lookupError, "bulkDeleteLeads"),
      ),
    );
  }

  const allowedIds = new Set((orgLeads ?? []).map((lead) => lead.id));
  const unauthorizedIds = leadIds.filter((leadId) => !allowedIds.has(leadId));

  if (unauthorizedIds.length > 0) {
    redirect(
      buildLeadsActionRedirectPath(
        returnTo,
        "error",
        "Beberapa lead tidak ditemukan atau berada di organisasi lain.",
      ),
    );
  }

  const failures: string[] = [];
  let deletedCount = 0;

  for (const leadId of leadIds) {
    const { data: deletedLead, error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId)
      .eq("organization_id", profile.organization_id)
      .select("id")
      .maybeSingle();

    if (error) {
      failures.push(
        formatBulkDeleteFailureMessage({
          leadId,
          message: formatActionError(error, "bulkDeleteLeads"),
        }),
      );
      continue;
    }

    if (!deletedLead) {
      failures.push(`Lead ${leadId} tidak ditemukan atau sudah dihapus.`);
      continue;
    }

    deletedCount += 1;
  }

  revalidatePath("/leads");

  if (failures.length > 0) {
    const failureSummary = failures.join(" ");
    const message =
      deletedCount > 0
        ? `${deletedCount} lead berhasil dihapus. Gagal menghapus ${failures.length} lead: ${failureSummary}`
        : `Gagal menghapus lead terpilih: ${failureSummary}`;

    redirect(
      buildLeadsActionRedirectPath(
        returnTo,
        deletedCount > 0 ? "success" : "error",
        message,
      ),
    );
  }

  redirect(
    buildLeadsActionRedirectPath(
      returnTo,
      "success",
      `${deletedCount} lead berhasil dihapus.`,
    ),
  );
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { createAutomaticFirstFollowUpTask } from "@/lib/leads/first-follow-up";
import {
  buildLeadsActionRedirectPath,
  formatBulkDeleteFailureMessage,
  parseLeadIds,
} from "@/lib/leads/bulk-delete";
import { resolveCampaignIdForOrganization } from "@/lib/campaigns/queries";
import { parseLeadSourceForSave } from "@/lib/leads/source-tracking";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createLead(formData: FormData) {
    const { profile } = await requireProfile();
    const supabase = await createClient();
  
    const fullName = getString(formData, "full_name");
    const whatsappNumber = getString(formData, "whatsapp_number");
    const email = getString(formData, "email");
    const source = parseLeadSourceForSave(getString(formData, "source"));
    const interestType = getString(formData, "interest_type") || "unknown";
    const packageInterest = getString(formData, "package_interest");
    const notes = getString(formData, "notes");
    const campaignIdInput = getString(formData, "campaign_id");
  
    if (!fullName) {
      redirect("/leads/new?error=Nama wajib diisi");
    }

    const campaignId = await resolveCampaignIdForOrganization(
      supabase,
      profile.organization_id,
      campaignIdInput,
    );

    if (campaignIdInput && !campaignId) {
      redirect("/leads/new?error=Campaign tidak valid");
    }
  
    const { data: createdLead, error } = await supabase
      .from("leads")
      .insert({
        organization_id: profile.organization_id,
        full_name: fullName,
        whatsapp_number: whatsappNumber || null,
        phone: whatsappNumber || null,
        email: email || null,
        source,
        interest_type: interestType,
        package_interest: packageInterest || null,
        notes: notes || null,
        campaign_id: campaignId,
        status: "new",
        priority: "medium",
      })
      .select("id")
      .single();
  
    if (error || !createdLead) {
      redirect(
        `/leads/new?error=${encodeURIComponent(error?.message ?? "Gagal membuat lead")}`,
      );
    }

    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: createdLead.id,
      actor_id: profile.id,
      activity_type: "note",
      title: "Lead dibuat",
      body: `Lead ${fullName} ditambahkan ke CRM.`,
    });

    await createAutomaticFirstFollowUpTask(
      supabase,
      profile,
      createdLead.id,
    );

    revalidatePath("/leads");
    redirect("/leads");
  }

export async function bulkDeleteLeads(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      buildLeadsActionRedirectPath(
        getString(formData, "return_to") || "/leads",
        "error",
        "Hanya admin atau owner yang dapat menghapus lead.",
      ),
    );
  }

  const returnTo = getString(formData, "return_to") || "/leads";
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
      buildLeadsActionRedirectPath(returnTo, "error", lookupError.message),
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
          message: error.message,
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
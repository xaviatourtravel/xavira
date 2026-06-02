"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalInt(formData: FormData, key: string): number | null {
  const value = getString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

const ACTIVITY_TYPES = [
  "note",
  "call",
  "whatsapp",
  "email",
  "status_change",
  "score_update",
  "follow_up_sent",
  "follow_up_generated",
] as const;

export async function createLeadActivity(formData: FormData) {
    const { profile } = await requireProfile();
    const supabase = await createClient();
  
    const leadId = getString(formData, "lead_id");
    const activityType = getString(formData, "activity_type") || "note";
    const title = getString(formData, "title");
    const body = getString(formData, "body");
  
    if (!leadId) {
      redirect("/leads?error=Lead tidak ditemukan");
    }
  
    if (!title && !body) {
      redirect(`/leads/${leadId}?error=Aktivitas wajib diisi`);
    }
  
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .maybeSingle();
  
    if (!lead) {
      redirect("/leads?error=Lead tidak ditemukan");
    }
  
    const { error } = await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: activityType,
      title: title || "Aktivitas baru",
      body: body || null,
    });
  
    if (error) {
      redirect(`/leads/${leadId}?error=${encodeURIComponent(error.message)}`);
    }
  
    revalidatePath(`/leads/${leadId}`);
    redirect(`/leads/${leadId}`);
  }

export async function updateLead(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const fullName = getString(formData, "full_name");
  const whatsappNumber = getString(formData, "whatsapp_number");
  const email = getString(formData, "email");
  const source = getString(formData, "source") || "other";
  const interestType = getString(formData, "interest_type") || "unknown";
  const packageInterest = getString(formData, "package_interest");
  const status = getString(formData, "status") || "new";
  const priority = getString(formData, "priority") || "medium";
  const budgetIdr = getOptionalInt(formData, "budget_idr");
  const travelDatePreference = getString(formData, "travel_date_preference");
  const partySize = getOptionalInt(formData, "party_size");
  const notes = getString(formData, "notes");

  if (!leadId) {
    redirect("/leads?error=Lead tidak ditemukan");
  }

  if (!fullName) {
    redirect(
      `/leads/${leadId}/edit?error=${encodeURIComponent("Nama wajib diisi")}`,
    );
  }

  const { data: updatedLead, error } = await supabase
    .from("leads")
    .update({
      full_name: fullName,
      whatsapp_number: whatsappNumber || null,
      phone: whatsappNumber || null,
      email: email || null,
      source,
      interest_type: interestType,
      package_interest: packageInterest || null,
      status,
      priority,
      budget_idr: budgetIdr,
      travel_date_preference: travelDatePreference || null,
      party_size: partySize,
      notes: notes || null,
    })
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/leads/${leadId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!updatedLead) {
    redirect("/leads?error=Lead tidak ditemukan");
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}



"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const ALLOWED_STATUS = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "won",
  "lost",
] as const;

type AllowedLeadStatus = (typeof ALLOWED_STATUS)[number];

function isAllowedLeadStatus(value: string): value is AllowedLeadStatus {
  return (ALLOWED_STATUS as readonly string[]).includes(value);
}

export async function updateLeadStatus(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const nextStatus = getString(formData, "next_status");

  if (!leadId || !isAllowedLeadStatus(nextStatus)) {
    redirect("/leads/pipeline?error=Status tidak valid");
  }

  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, status, full_name")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existingLead) {
    redirect("/leads/pipeline?error=Lead tidak ditemukan");
  }

  const { error } = await supabase
    .from("leads")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    redirect(`/leads/pipeline?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "status_change",
    title: "Status lead berubah",
    body: `Status berubah dari ${existingLead.status} menjadi ${nextStatus}.`,
  });

  revalidatePath("/leads");
  revalidatePath("/leads/pipeline");
  revalidatePath(`/leads/${leadId}`);

  redirect("/leads/pipeline");
}
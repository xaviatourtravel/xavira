"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/session";
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
    const source = getString(formData, "source") || "other";
    const interestType = getString(formData, "interest_type") || "unknown";
    const packageInterest = getString(formData, "package_interest");
    const notes = getString(formData, "notes");
  
    if (!fullName) {
      redirect("/leads/new?error=Nama wajib diisi");
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
        status: "new",
        priority: "medium",
      })
      .select("id")
      .single();
  
    if (error) {
      redirect(`/leads/new?error=${encodeURIComponent(error.message)}`);
    }
  
    if (createdLead) {
      await supabase.from("lead_activities").insert({
        organization_id: profile.organization_id,
        lead_id: createdLead.id,
        actor_id: profile.id,
        activity_type: "note",
        title: "Lead dibuat",
        body: `Lead ${fullName} ditambahkan ke CRM.`,
      });
    }
  
    revalidatePath("/leads");
    redirect("/leads");
  }
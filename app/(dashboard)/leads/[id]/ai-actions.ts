"use server";

import OpenAI from "openai";

import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function generateAiFollowUp(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");

  if (!leadId) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, full_name, status, interest_type, package_interest, notes, whatsapp_number, phone",
    )
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const { data: selectedPackage } = lead.package_interest
    ? await supabase
        .from("packages")
        .select("name, destination, departure_date, duration_days, price_idr, quota")
        .eq("organization_id", profile.organization_id)
        .eq("name", lead.package_interest)
        .maybeSingle()
    : { data: null };

  const { data: activities } = await supabase
    .from("lead_activities")
    .select("activity_type, title, body, occurred_at")
    .eq("lead_id", leadId)
    .eq("organization_id", profile.organization_id)
    .order("occurred_at", { ascending: false })
    .limit(5);

  const prompt = `
Kamu adalah sales assistant untuk travel Umroh dan Halal Tour.

Buat pesan WhatsApp follow up dalam Bahasa Indonesia.
Gaya bahasa: sopan, hangat, profesional, tidak terlalu panjang.
Jangan terlalu hard selling.
Gunakan sapaan nama lead.

Data lead:
- Nama: ${lead.full_name}
- Status: ${lead.status}
- Minat: ${lead.interest_type}
- Paket diminati: ${lead.package_interest ?? "-"}
- Catatan lead: ${lead.notes ?? "-"}

Data paket:
- Nama paket: ${selectedPackage?.name ?? "-"}
- Destinasi: ${selectedPackage?.destination ?? "-"}
- Durasi: ${selectedPackage?.duration_days ?? "-"} hari
- Harga: ${selectedPackage?.price_idr ?? "-"}
- Kuota: ${selectedPackage?.quota ?? "-"}
- Tanggal berangkat: ${selectedPackage?.departure_date ?? "-"}

Aktivitas terakhir:
${(activities ?? [])
  .map(
    (activity) =>
      `- ${activity.activity_type}: ${activity.title ?? ""} ${activity.body ?? ""}`,
  )
  .join("\n")}

Output hanya isi pesan WhatsApp. Jangan pakai markdown.
`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = response.output_text;

  return {
    success: true,
    message: text,
  };
}
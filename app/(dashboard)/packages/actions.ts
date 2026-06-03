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
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function createPackage(formData: FormData) {
  console.log("CREATE PACKAGE ACTION RUNNING");
  
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const name = getString(formData, "name");
  const destination = getString(formData, "destination");
  const departureDate = getString(formData, "departure_date");
  const durationDays = getOptionalInt(formData, "duration_days");
  const priceIdr = getOptionalInt(formData, "price_idr");
  const quota = getOptionalInt(formData, "quota");
  const status = getString(formData, "status") || "draft";

  if (!name) {
    redirect("/packages/new?error=Nama paket wajib diisi");
  }

  const { error } = await supabase.from("packages").insert({
    organization_id: profile.organization_id,
    name,
    destination: destination || null,
    departure_date: departureDate || null,
    duration_days: durationDays,
    price_idr: priceIdr,
    quota,
    status,
  });
  console.log("CREATE PACKAGE ERROR:", error);

  if (error) {
    redirect(`/packages/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/packages");
  redirect("/packages");
}
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

function getOptionalNumber(formData: FormData, key: string): number | null {
  const value = getString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function updateBooking(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const packageName = getString(formData, "package_name");
  const departureDate = getString(formData, "departure_date");
  const totalPax = getOptionalInt(formData, "total_pax");
  const totalAmount = getOptionalNumber(formData, "total_amount");
  const notes = getString(formData, "notes");

  if (!bookingId) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  if (!totalPax || totalPax < 1) {
    redirect(
      `/bookings/${bookingId}/edit?error=${encodeURIComponent("Total pax minimal 1")}`,
    );
  }

  if (totalAmount == null || totalAmount < 0) {
    redirect(
      `/bookings/${bookingId}/edit?error=${encodeURIComponent("Total amount tidak valid")}`,
    );
  }

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      package_name: packageName || null,
      departure_date: departureDate || null,
      total_pax: totalPax,
      total_amount: totalAmount,
      notes: notes || null,
    })
    .eq("id", bookingId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/bookings/${bookingId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!updatedBooking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Booking berhasil diperbarui.")}`,
  );
}

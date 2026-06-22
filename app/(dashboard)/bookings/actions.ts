"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { formatActionError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildReturnPath(returnTo: string, message: string, type: "success" | "error") {
  const basePath =
    returnTo.startsWith("/bookings") && !returnTo.startsWith("//")
      ? returnTo
      : "/bookings";
  const separator = basePath.includes("?") ? "&" : "?";

  return `${basePath}${separator}${type}=${encodeURIComponent(message)}`;
}

export async function deleteBooking(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const returnTo = getString(formData, "return_to") || "/bookings";

  if (!bookingId) {
    redirect(buildReturnPath(returnTo, "Booking tidak ditemukan", "error"));
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!booking) {
    redirect(buildReturnPath(returnTo, "Booking tidak ditemukan", "error"));
  }

  const { data: deletedBooking, error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(buildReturnPath(returnTo, formatActionError(error, "deleteBooking"), "error"));
  }

  if (!deletedBooking) {
    redirect(
      buildReturnPath(
        returnTo,
        "Booking tidak dapat dihapus. Periksa izin akses.",
        "error",
      ),
    );
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);

  redirect(
    buildReturnPath(returnTo, "Booking berhasil dihapus.", "success"),
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { calculateBookingPaymentStatus } from "@/lib/bookings/payment-status";
import { calculateBookingTotalAmount } from "@/lib/bookings/total-amount";
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

  let resolvedTotalAmount = totalAmount ?? 0;

  if (packageName) {
    const { data: matchedPackage } = await supabase
      .from("packages")
      .select("price_idr")
      .eq("organization_id", profile.organization_id)
      .eq("name", packageName)
      .maybeSingle();

    if (matchedPackage?.price_idr != null) {
      resolvedTotalAmount = calculateBookingTotalAmount(
        matchedPackage.price_idr,
        totalPax,
      );
    }
  }

  if (resolvedTotalAmount < 0) {
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
      total_amount: resolvedTotalAmount,
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

async function getBookingForOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string,
  organizationId: string,
) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return booking;
}

async function syncBookingPaymentStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string,
  organizationId: string,
) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("total_amount")
    .eq("id", bookingId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!booking) {
    return;
  }

  const { data: payments } = await supabase
    .from("booking_payments")
    .select("amount")
    .eq("booking_id", bookingId);

  const totalPayments = (payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

  const paymentStatus = calculateBookingPaymentStatus(
    Number(booking.total_amount ?? 0),
    totalPayments,
  );

  await supabase
    .from("bookings")
    .update({ payment_status: paymentStatus })
    .eq("id", bookingId)
    .eq("organization_id", organizationId);
}

export async function createBookingParticipant(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const fullName = getString(formData, "full_name");
  const phone = getString(formData, "phone");
  const passportNumber = getString(formData, "passport_number");
  const address = getString(formData, "address");
  const emergencyContact = getString(formData, "emergency_contact");
  const notes = getString(formData, "notes");

  if (!bookingId) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  if (!fullName) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Nama peserta wajib diisi")}`,
    );
  }

  const booking = await getBookingForOrg(
    supabase,
    bookingId,
    profile.organization_id,
  );

  if (!booking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  const { error } = await supabase.from("booking_participants").insert({
    booking_id: bookingId,
    full_name: fullName,
    phone: phone || null,
    passport_number: passportNumber || null,
    address: address || null,
    emergency_contact: emergencyContact || null,
    notes: notes || null,
  });

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/bookings/${bookingId}`, "page");
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Participant berhasil ditambahkan.")}`,
  );
}

export async function updateBookingParticipant(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const participantId = getString(formData, "participant_id");
  const fullName = getString(formData, "full_name");
  const phone = getString(formData, "phone");
  const passportNumber = getString(formData, "passport_number");
  const address = getString(formData, "address");
  const emergencyContact = getString(formData, "emergency_contact");
  const notes = getString(formData, "notes");

  if (!bookingId || !participantId) {
    redirect("/bookings?error=Participant tidak ditemukan");
  }

  if (!fullName) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Nama peserta wajib diisi")}`,
    );
  }

  const booking = await getBookingForOrg(
    supabase,
    bookingId,
    profile.organization_id,
  );

  if (!booking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  const { data: participant } = await supabase
    .from("booking_participants")
    .select("id")
    .eq("id", participantId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (!participant) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Participant tidak ditemukan")}`,
    );
  }

  const { data: updatedParticipant, error } = await supabase
    .from("booking_participants")
    .update({
      full_name: fullName,
      phone: phone || null,
      passport_number: passportNumber || null,
      address: address || null,
      emergency_contact: emergencyContact || null,
      notes: notes || null,
    })
    .eq("id", participantId)
    .eq("booking_id", bookingId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!updatedParticipant) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Gagal memperbarui participant")}`,
    );
  }

  revalidatePath(`/bookings/${bookingId}`, "page");
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Participant berhasil diperbarui.")}`,
  );
}

export async function deleteBookingParticipant(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const participantId = getString(formData, "participant_id");

  if (!bookingId || !participantId) {
    redirect("/bookings?error=Participant tidak ditemukan");
  }

  const booking = await getBookingForOrg(
    supabase,
    bookingId,
    profile.organization_id,
  );

  if (!booking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  const { data: participant } = await supabase
    .from("booking_participants")
    .select("id")
    .eq("id", participantId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (!participant) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Participant tidak ditemukan")}`,
    );
  }

  const { data: deletedParticipant, error } = await supabase
    .from("booking_participants")
    .delete()
    .eq("id", participantId)
    .eq("booking_id", bookingId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!deletedParticipant) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Gagal menghapus participant")}`,
    );
  }

  revalidatePath(`/bookings/${bookingId}`, "page");
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Participant berhasil dihapus.")}`,
  );
}

const PAYMENT_TYPES = ["dp", "installment", "final"] as const;

export async function createBookingPayment(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const paymentType = getString(formData, "payment_type");
  const amount = getOptionalNumber(formData, "amount");
  const paymentDate = getString(formData, "payment_date");
  const notes = getString(formData, "notes");

  if (!bookingId) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  if (!PAYMENT_TYPES.includes(paymentType as (typeof PAYMENT_TYPES)[number])) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Jenis pembayaran tidak valid")}`,
    );
  }

  if (amount == null || amount < 0) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Jumlah pembayaran tidak valid")}`,
    );
  }

  const booking = await getBookingForOrg(
    supabase,
    bookingId,
    profile.organization_id,
  );

  if (!booking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  const { error } = await supabase.from("booking_payments").insert({
    booking_id: bookingId,
    payment_type: paymentType,
    amount,
    payment_date: paymentDate || null,
    notes: notes || null,
  });

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  await syncBookingPaymentStatus(
    supabase,
    bookingId,
    profile.organization_id,
  );

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`, "page");
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Payment berhasil ditambahkan.")}`,
  );
}

export async function deleteBookingPayment(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const paymentId = getString(formData, "payment_id");

  if (!bookingId || !paymentId) {
    redirect("/bookings?error=Payment tidak ditemukan");
  }

  const booking = await getBookingForOrg(
    supabase,
    bookingId,
    profile.organization_id,
  );

  if (!booking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  const { data: payment } = await supabase
    .from("booking_payments")
    .select("id")
    .eq("id", paymentId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (!payment) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Payment tidak ditemukan")}`,
    );
  }

  const { data: deletedPayment, error } = await supabase
    .from("booking_payments")
    .delete()
    .eq("id", paymentId)
    .eq("booking_id", bookingId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!deletedPayment) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Gagal menghapus payment")}`,
    );
  }

  await syncBookingPaymentStatus(
    supabase,
    bookingId,
    profile.organization_id,
  );

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`, "page");
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Payment berhasil dihapus.")}`,
  );
}

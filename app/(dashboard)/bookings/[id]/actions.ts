"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { auditFromProfile } from "@/lib/audit";
import type { Profile } from "@/types/app-types";
import {
  BOOKING_PAYMENT_METHODS,
  formatPaymentTypeLabel,
  normalizeBookingPaymentType,
} from "@/lib/bookings/payment-fields";
import { calculateBookingPaymentStatus } from "@/lib/bookings/payment-status";
import {
  calculateBookingFinalTotal,
  normalizeDiscountAmount,
  validateBookingDiscount,
} from "@/lib/bookings/discount";
import { calculateBookingTotalAmount } from "@/lib/bookings/total-amount";
import { encodeActionError } from "@/lib/errors";
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

function assertBookingPermission(
  profile: Awaited<ReturnType<typeof requireProfile>>["profile"],
  permission: "bookings.edit" | "payments.create",
  bookingId: string,
) {
  if (!hasPermission(profile, permission)) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("You do not have permission to perform this action.")}`,
    );
  }
}

export async function updateBooking(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  assertBookingPermission(profile, "bookings.edit", bookingId || "unknown");
  const packageName = getString(formData, "package_name");
  const departureDate = getString(formData, "departure_date");
  const totalPax = getOptionalInt(formData, "total_pax");
  const subtotalAmountInput = getOptionalNumber(formData, "subtotal_amount");
  const discountAmountInput = getOptionalNumber(formData, "discount_amount");
  const discountNote = getString(formData, "discount_note");
  const notes = getString(formData, "notes");

  if (!bookingId) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  if (!totalPax || totalPax < 1) {
    redirect(
      `/bookings/${bookingId}/edit?error=${encodeURIComponent("Total pax minimal 1")}`,
    );
  }

  const { data: existingBooking } = await supabase
    .from("bookings")
    .select(
      "id, subtotal_amount, discount_amount, discount_note, total_amount, booking_code, customer_name",
    )
    .eq("id", bookingId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!existingBooking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  let resolvedSubtotal = subtotalAmountInput ?? 0;

  if (packageName) {
    const { data: matchedPackage } = await supabase
      .from("packages")
      .select("price_idr")
      .eq("organization_id", profile.organization_id)
      .eq("name", packageName)
      .maybeSingle();

    if (matchedPackage?.price_idr != null) {
      resolvedSubtotal = calculateBookingTotalAmount(
        matchedPackage.price_idr,
        totalPax,
      );
    }
  }

  const resolvedDiscount = normalizeDiscountAmount(discountAmountInput);
  const discountValidationError = validateBookingDiscount(
    resolvedSubtotal,
    resolvedDiscount,
  );

  if (discountValidationError) {
    redirect(
      `/bookings/${bookingId}/edit?error=${encodeURIComponent(discountValidationError)}`,
    );
  }

  const resolvedTotalAmount = calculateBookingFinalTotal(
    resolvedSubtotal,
    resolvedDiscount,
  );

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      package_name: packageName || null,
      departure_date: departureDate || null,
      total_pax: totalPax,
      subtotal_amount: resolvedSubtotal,
      discount_amount: resolvedDiscount,
      discount_note: resolvedDiscount > 0 ? discountNote || null : null,
      total_amount: resolvedTotalAmount,
      notes: notes || null,
    })
    .eq("id", bookingId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/bookings/${bookingId}/edit?error=${encodeActionError(error)}`,
    );
  }

  if (!updatedBooking) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  const previousDiscount = Number(existingBooking.discount_amount ?? 0);
  const discountChanged =
    previousDiscount !== resolvedDiscount ||
    (existingBooking.discount_note ?? "") !== (resolvedDiscount > 0 ? discountNote : "");

  if (discountChanged) {
    await auditFromProfile(supabase, profile, {
      action: "booking_discount_updated",
      entityType: "booking",
      entityId: bookingId,
      entityLabel:
        existingBooking.booking_code ||
        existingBooking.customer_name ||
        bookingId,
      metadata: {
        old_discount_amount: previousDiscount,
        new_discount_amount: resolvedDiscount,
        discount_note: resolvedDiscount > 0 ? discountNote || null : null,
      },
    });
  }

  await syncBookingPaymentStatus(
    supabase,
    bookingId,
    profile.organization_id,
    profile,
  );

  await auditFromProfile(supabase, profile, {
    action: "booking_updated",
    entityType: "booking",
    entityId: bookingId,
    entityLabel:
      existingBooking.booking_code ||
      existingBooking.customer_name ||
      bookingId,
  });

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
    .select("id, lead_id, organization_id, booking_code, customer_name")
    .eq("id", bookingId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return booking;
}

function formatPaymentActivityBody(paymentType: string, amount: number) {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatPaymentTypeLabel(paymentType)} sebesar ${formattedAmount} telah dicatat.`;
}

async function logLeadActivityForBookingPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  booking: { lead_id: string | null; organization_id: string },
  actorId: string,
  paymentType: string,
  amount: number,
) {
  if (!booking.lead_id) {
    return;
  }

  await supabase.from("lead_activities").insert({
    organization_id: booking.organization_id,
    lead_id: booking.lead_id,
    actor_id: actorId,
    activity_type: "note",
    title: "Payment Ditambahkan",
    body: formatPaymentActivityBody(paymentType, amount),
  });
}

function formatPaymentUpdatedActivityBody(paymentType: string, amount: number) {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

  return `Payment ${formatPaymentTypeLabel(paymentType)} diperbarui menjadi ${formattedAmount}.`;
}

async function logLeadActivityForBookingPaymentUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  booking: { lead_id: string | null; organization_id: string },
  actorId: string,
  paymentType: string,
  amount: number,
) {
  if (!booking.lead_id) {
    return;
  }

  await supabase.from("lead_activities").insert({
    organization_id: booking.organization_id,
    lead_id: booking.lead_id,
    actor_id: actorId,
    activity_type: "note",
    title: "Payment Diperbarui",
    body: formatPaymentUpdatedActivityBody(paymentType, amount),
  });
}

async function syncBookingPaymentStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string,
  organizationId: string,
  profile?: Profile,
) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("total_amount, payment_status, booking_code, customer_name")
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

  const previousStatus = booking.payment_status;

  if (previousStatus === paymentStatus) {
    return;
  }

  await supabase
    .from("bookings")
    .update({ payment_status: paymentStatus })
    .eq("id", bookingId)
    .eq("organization_id", organizationId);

  if (profile) {
    await auditFromProfile(supabase, profile, {
      action: "payment_status_changed",
      entityType: "payment",
      entityId: bookingId,
      entityLabel: booking.booking_code || booking.customer_name || bookingId,
      metadata: {
        from: previousStatus,
        to: paymentStatus,
      },
    });
  }
}

export async function createBookingParticipant(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const fullName = getString(formData, "full_name");
  const phone = getString(formData, "phone");
  const passportNumber = getString(formData, "passport_number");
  const passportPhotoUrl = getString(formData, "passport_photo_url");
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
    passport_photo_url: passportPhotoUrl || null,
    address: address || null,
    emergency_contact: emergencyContact || null,
    notes: notes || null,
  });

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeActionError(error)}`,
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
  const passportPhotoUrl = getString(formData, "passport_photo_url");
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
      passport_photo_url: passportPhotoUrl || null,
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
      `/bookings/${bookingId}?error=${encodeActionError(error)}`,
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
      `/bookings/${bookingId}?error=${encodeActionError(error)}`,
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

function parseBookingPaymentFields(formData: FormData) {
  const paymentTypeRaw = getString(formData, "payment_type");
  const paymentMethodRaw = getString(formData, "payment_method");
  const paymentType = normalizeBookingPaymentType(paymentTypeRaw);
  const paymentMethod = paymentMethodRaw || null;

  return {
    paymentType,
    paymentMethod,
    paymentDate: getString(formData, "payment_date"),
    referenceNumber: getString(formData, "reference_number"),
    notes: getString(formData, "notes"),
    amount: getOptionalNumber(formData, "amount"),
  };
}

function validateBookingPaymentInput(
  bookingId: string,
  paymentType: ReturnType<typeof normalizeBookingPaymentType>,
  paymentMethod: string | null,
  amount: number | null,
) {
  if (!paymentType) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Jenis pembayaran tidak valid")}`,
    );
  }

  if (
    paymentMethod &&
    !BOOKING_PAYMENT_METHODS.includes(
      paymentMethod as (typeof BOOKING_PAYMENT_METHODS)[number],
    )
  ) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Metode pembayaran tidak valid")}`,
    );
  }

  if (amount == null || amount < 0) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Jumlah pembayaran tidak valid")}`,
    );
  }
}

export async function createBookingPayment(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  assertBookingPermission(profile, "payments.create", bookingId || "unknown");
  const {
    paymentType,
    paymentMethod,
    paymentDate,
    referenceNumber,
    notes,
    amount,
  } = parseBookingPaymentFields(formData);

  if (!bookingId) {
    redirect("/bookings?error=Booking tidak ditemukan");
  }

  validateBookingPaymentInput(bookingId, paymentType, paymentMethod, amount);

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
    payment_type: paymentType!,
    payment_method: paymentMethod,
    reference_number: referenceNumber || null,
    amount: amount!,
    payment_date: paymentDate || null,
    notes: notes || null,
  });

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeActionError(error)}`,
    );
  }

  await logLeadActivityForBookingPayment(
    supabase,
    booking,
    profile.id,
    paymentType!,
    amount!,
  );

  await auditFromProfile(supabase, profile, {
    action: "payment_added",
    entityType: "payment",
    entityId: bookingId,
    entityLabel: booking.booking_code || booking.customer_name || bookingId,
    metadata: {
      payment_type: paymentType!,
      amount: amount!,
    },
  });

  await syncBookingPaymentStatus(
    supabase,
    bookingId,
    profile.organization_id,
    profile,
  );

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`, "page");
  if (booking.lead_id) {
    revalidatePath(`/leads/${booking.lead_id}`);
  }
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Payment berhasil ditambahkan.")}`,
  );
}

export async function updateBookingPayment(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  assertBookingPermission(profile, "payments.create", bookingId || "unknown");
  const paymentId = getString(formData, "payment_id");
  const {
    paymentType,
    paymentMethod,
    paymentDate,
    referenceNumber,
    notes,
    amount,
  } = parseBookingPaymentFields(formData);

  if (!bookingId || !paymentId) {
    redirect("/bookings?error=Payment tidak ditemukan");
  }

  validateBookingPaymentInput(bookingId, paymentType, paymentMethod, amount);

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

  const { data: updatedPayment, error } = await supabase
    .from("booking_payments")
    .update({
      payment_type: paymentType!,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      amount: amount!,
      payment_date: paymentDate || null,
      notes: notes || null,
    })
    .eq("id", paymentId)
    .eq("booking_id", bookingId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/bookings/${bookingId}?error=${encodeActionError(error)}`,
    );
  }

  if (!updatedPayment) {
    redirect(
      `/bookings/${bookingId}?error=${encodeURIComponent("Gagal memperbarui payment")}`,
    );
  }

  await logLeadActivityForBookingPaymentUpdate(
    supabase,
    booking,
    profile.id,
    paymentType!,
    amount!,
  );

  await syncBookingPaymentStatus(
    supabase,
    bookingId,
    profile.organization_id,
    profile,
  );

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`, "page");
  if (booking.lead_id) {
    revalidatePath(`/leads/${booking.lead_id}`);
  }
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Payment berhasil diperbarui.")}`,
  );
}

export async function deleteBookingPayment(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  assertBookingPermission(profile, "payments.create", bookingId || "unknown");
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
      `/bookings/${bookingId}?error=${encodeActionError(error)}`,
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
    profile,
  );

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`, "page");
  if (booking.lead_id) {
    revalidatePath(`/leads/${booking.lead_id}`);
  }
  redirect(
    `/bookings/${bookingId}?success=${encodeURIComponent("Payment berhasil dihapus.")}`,
  );
}

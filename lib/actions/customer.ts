"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auditFromProfile } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { calculateBookingTotalAmount } from "@/lib/bookings/total-amount";
import { encodeActionError } from "@/lib/errors";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function resolveWorkspacePath(leadId: string, formData: FormData) {
  const returnTo = getString(formData, "return_to");
  if (returnTo.startsWith("/customers/")) {
    return returnTo.split("?")[0] || customerWorkspaceHref(leadId);
  }

  return customerWorkspaceHref(leadId);
}

function workspaceRedirectPath(
  leadId: string,
  formData: FormData,
  query?: Record<string, string>,
) {
  const base = resolveWorkspacePath(leadId, formData);
  if (!query || Object.keys(query).length === 0) {
    return base;
  }

  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

function generateBookingCode() {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/-/g, "");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";

  for (let i = 0; i < 4; i += 1) {
    randomPart += chars[Math.floor(Math.random() * chars.length)];
  }

  return `BK-${datePart}-${randomPart}`;
}

function formatBookingCreatedActivityBody(
  bookingCode: string | null,
  packageName: string | null,
) {
  const code = bookingCode?.trim() || "baru";
  const packageLabel = packageName?.trim();

  if (packageLabel) {
    return `Booking ${code} untuk paket ${packageLabel} berhasil dibuat.`;
  }

  return `Booking ${code} berhasil dibuat.`;
}

export async function convertLeadToBooking(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const leadId = getString(formData, "lead_id");

  if (!hasPermission(profile, "bookings.create")) {
    redirect(
      workspaceRedirectPath(leadId || "", formData, {
        error: encodeURIComponent("Anda tidak memiliki izin membuat booking"),
      }),
    );
  }

  if (!leadId) {
    redirect("/leads?error=Customer tidak ditemukan");
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name, package_interest, party_size, organization_id")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    redirect("/leads?error=Customer tidak ditemukan");
  }

  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("lead_id", leadId)
    .eq("organization_id", profile.organization_id)
    .limit(1)
    .maybeSingle();

  if (existingBooking) {
    redirect(
      workspaceRedirectPath(leadId, formData, {
        error: encodeURIComponent("Customer ini sudah memiliki booking"),
      }),
    );
  }

  const totalPax =
    lead.party_size != null && lead.party_size >= 1 ? lead.party_size : 1;

  let departureDate: string | null = null;
  let totalAmount = 0;

  if (lead.package_interest) {
    const { data: matchedPackage } = await supabase
      .from("packages")
      .select("departure_date, price_idr")
      .eq("organization_id", profile.organization_id)
      .eq("name", lead.package_interest)
      .maybeSingle();

    if (matchedPackage) {
      departureDate = matchedPackage.departure_date;

      totalAmount = calculateBookingTotalAmount(
        matchedPackage.price_idr,
        totalPax,
      );
    }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      customer_name: lead.full_name,
      package_name: lead.package_interest || null,
      departure_date: departureDate,
      booking_code: generateBookingCode(),
      booking_status: "new",
      payment_status: "unpaid",
      total_pax: totalPax,
      subtotal_amount: totalAmount,
      discount_amount: 0,
      total_amount: totalAmount,
    })
    .select("id, booking_code")
    .maybeSingle();

  if (error || !booking) {
    redirect(
      workspaceRedirectPath(leadId, formData, {
        error: encodeActionError(error ?? "Gagal membuat booking", "convertLeadToBooking"),
      }),
    );
  }

  await supabase.from("lead_activities").insert({
    organization_id: lead.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "note",
    title: "Booking Dibuat",
    body: formatBookingCreatedActivityBody(
      booking.booking_code,
      lead.package_interest,
    ),
  });

  await auditFromProfile(supabase, profile, {
    action: "booking_created",
    entityType: "booking",
    entityId: booking.id,
    entityLabel: booking.booking_code,
    metadata: {
      lead_id: leadId,
      booking_status: "new",
      payment_status: "unpaid",
    },
  });

  revalidatePath("/bookings");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/customers/${leadId}`);
  redirect(`/bookings/${booking.id}`);
}

export async function createCustomerNote(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const title = getString(formData, "title");
  const body = getString(formData, "body");

  if (!leadId) {
    redirect("/leads?error=Customer tidak ditemukan");
  }

  if (!title && !body) {
    redirect(
      workspaceRedirectPath(leadId, formData, {
        error: encodeURIComponent("Catatan wajib diisi"),
      }),
    );
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    redirect("/leads?error=Customer tidak ditemukan");
  }

  const { error } = await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "note",
    title: title || "Catatan internal",
    body: body || null,
  });

  if (error) {
    redirect(
      workspaceRedirectPath(leadId, formData, {
        error: encodeActionError(error),
      }),
    );
  }

  revalidatePath(customerWorkspaceHref(leadId));
  redirect(
    workspaceRedirectPath(leadId, formData, {
      success: encodeURIComponent("Catatan berhasil disimpan"),
    }),
  );
}

export async function createCustomerFollowUp(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const dueDate = getString(formData, "due_date");

  if (!hasPermission(profile, "followups.create")) {
    redirect(
      workspaceRedirectPath(leadId || "", formData, {
        error: encodeURIComponent("Anda tidak memiliki izin membuat tindak lanjut"),
      }),
    );
  }

  if (!leadId) {
    redirect("/leads?error=Customer tidak ditemukan");
  }

  if (!title) {
    redirect(
      workspaceRedirectPath(leadId, formData, {
        error: encodeURIComponent("Judul tugas wajib diisi"),
      }),
    );
  }

  if (!dueDate) {
    redirect(
      workspaceRedirectPath(leadId, formData, {
        error: encodeURIComponent("Tanggal jatuh tempo wajib diisi"),
      }),
    );
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    redirect("/leads?error=Customer tidak ditemukan");
  }

  const { error } = await supabase.from("follow_up_tasks").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    title,
    description: description || null,
    due_date: new Date(dueDate).toISOString(),
    status: "pending",
    created_by: profile.id,
  });

  if (error) {
    redirect(
      workspaceRedirectPath(leadId, formData, {
        error: encodeActionError(error),
      }),
    );
  }

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "note",
    title: "Tindak lanjut dijadwalkan",
    body: `${title} pada ${dueDate}.`,
  });

  await auditFromProfile(supabase, profile, {
    action: "follow_up_created",
    entityType: "lead",
    entityId: leadId,
    entityLabel: lead.full_name,
    metadata: {
      source: "customer_workspace",
      due_date: dueDate,
    },
  });

  revalidatePath(customerWorkspaceHref(leadId));
  redirect(
    workspaceRedirectPath(leadId, formData, {
      success: encodeURIComponent("Tugas tindak lanjut berhasil dibuat"),
    }),
  );
}

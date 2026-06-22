"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { calculateBookingTotalAmount } from "@/lib/bookings/total-amount";
import {
  createAutomaticStatusFollowUpTask,
  getFollowUpDueDateInDays,
} from "@/lib/leads/first-follow-up";
import {
  getLeadNextBestAction,
  getRecommendationFollowUpDueDays,
  getRecommendationFollowUpTaskTitle,
} from "@/lib/leads/next-best-action";
import { hasPermission, isAdminOrOwner } from "@/lib/auth/permissions";
import { auditFromProfile } from "@/lib/audit";
import { resolveCampaignIdForOrganization } from "@/lib/campaigns/queries";
import { requireProfile } from "@/lib/auth/session";
import { buildLeadsActionRedirectPath } from "@/lib/leads/bulk-delete";
import type { LeadFormValues } from "@/lib/leads/lead-form-types";
import {
  getLeadFormString,
  parseLeadFormFields,
} from "@/lib/leads/lead-form-parsing";
import { canEditLead } from "@/lib/leads/permissions";
import {
  formatSnoozeUntilLabel,
  parseSnoozePreset,
  resolveSnoozeUntil,
} from "@/lib/automation/snooze";
import { encodeActionError, formatActionError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
      redirect(`/leads/${leadId}?error=${encodeActionError(error)}`);
    }
  
    revalidatePath(`/leads/${leadId}`);
    redirect(`/leads/${leadId}`);
  }

  export async function createFollowUpTask(formData: FormData) {
    const { profile } = await requireProfile();
    const supabase = await createClient();
  
    const leadId = getString(formData, "lead_id");

    if (!hasPermission(profile, "followups.create")) {
      redirect(
        `/leads/${leadId || ""}?error=${encodeURIComponent("You do not have permission to create follow-ups.")}`,
      );
    }
    const title = getString(formData, "title");
    const description = getString(formData, "description");
    const dueDate = getString(formData, "due_date");
  
    if (!leadId) {
      redirect("/leads?error=Lead tidak ditemukan");
    }
  
    if (!title) {
      redirect(
        `/leads/${leadId}?error=${encodeURIComponent("Judul follow up wajib diisi")}`,
      );
    }
  
    if (!dueDate) {
      redirect(
        `/leads/${leadId}?error=${encodeURIComponent("Tanggal follow up wajib diisi")}`,
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
      redirect("/leads?error=Lead tidak ditemukan");
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
      redirect(`/leads/${leadId}?error=${encodeActionError(error)}`);
    }
  
    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: "note",
      title: "Follow up dijadwalkan",
      body: `${title} pada ${dueDate}.`,
    });

    await auditFromProfile(supabase, profile, {
      action: "follow_up_created",
      entityType: "lead",
      entityId: leadId,
      entityLabel: lead.full_name,
      metadata: {
        source: "lead_detail",
        due_date: dueDate,
      },
    });
  
    revalidatePath(`/leads/${leadId}`);
    redirect(`/leads/${leadId}`);
  }

  export async function createFollowUpFromRecommendation(formData: FormData) {
    const { profile } = await requireProfile();
    const supabase = await createClient();

    const leadId = getString(formData, "lead_id");

    if (!leadId) {
      redirect("/leads?error=Lead tidak ditemukan");
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, status, updated_at")
      .eq("id", leadId)
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!lead) {
      redirect("/leads?error=Lead tidak ditemukan");
    }

    const recommendation = getLeadNextBestAction({
      status: lead.status,
      updatedAt: lead.updated_at,
    });
    const taskTitle = getRecommendationFollowUpTaskTitle(lead.status);
    const dueDays = getRecommendationFollowUpDueDays(recommendation.priority);

    const { data: existingTask } = await supabase
      .from("follow_up_tasks")
      .select("id")
      .eq("lead_id", leadId)
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .eq("title", taskTitle)
      .maybeSingle();

    if (existingTask) {
      redirect(
        `/leads/${leadId}?error=${encodeURIComponent("Follow up rekomendasi sudah dijadwalkan.")}`,
      );
    }

    const { error } = await supabase.from("follow_up_tasks").insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      title: taskTitle,
      status: "pending",
      due_date: getFollowUpDueDateInDays(dueDays),
      created_by: profile.id,
    });

    if (error) {
      redirect(`/leads/${leadId}?error=${encodeActionError(error)}`);
    }

    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: "note",
      title: "Follow Up dibuat dari AI Recommendation",
      body: recommendation.text,
    });

    revalidatePath(`/leads/${leadId}`);
    redirect(
      `/leads/${leadId}?success=${encodeURIComponent("Follow up rekomendasi berhasil dibuat.")}`,
    );
  }

  export async function completeFollowUpTask(formData: FormData) {
    const { profile } = await requireProfile();
    const supabase = await createClient();
  
    const leadId = getString(formData, "lead_id");
    const taskId = getString(formData, "task_id");
  
    if (!leadId || !taskId) {
      redirect("/leads?error=Follow up tidak ditemukan");
    }
  
    const { data: task, error: taskError } = await supabase
      .from("follow_up_tasks")
      .select("id, title")
      .eq("id", taskId)
      .eq("lead_id", leadId)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();
  
    if (taskError || !task) {
      redirect(`/leads/${leadId}?error=Follow up tidak ditemukan`);
    }
  
    const { error } = await supabase
      .from("follow_up_tasks")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("organization_id", profile.organization_id);
  
    if (error) {
      redirect(`/leads/${leadId}?error=${encodeActionError(error)}`);
    }
  
    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: "note",
      title: "Follow up selesai",
      body: `Follow up "${task.title}" ditandai selesai.`,
    });
  
    revalidatePath(`/leads/${leadId}`);
    redirect(`/leads/${leadId}`);
  }

function buildUpdateLeadErrorRedirect(
  leadId: string,
  returnTo: string,
  message: string,
) {
  if (returnTo) {
    return buildLeadsActionRedirectPath(returnTo, "error", message);
  }

  return `/leads/${leadId}/edit?error=${encodeURIComponent(message)}`;
}

export async function getLeadForEditForm(
  leadId: string,
): Promise<{ values: LeadFormValues } | { error: string }> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, organization_id, full_name, whatsapp_number, email, source, lead_date, lead_temperature, package_interest, status, assigned_to, campaign_id, budget_idr, party_size, travel_date_preference, notes",
    )
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !lead) {
    return { error: "Lead tidak ditemukan" };
  }

  if (!canEditLead(profile, lead)) {
    return { error: "Anda tidak memiliki izin untuk mengubah lead ini." };
  }

  return {
    values: {
      full_name: lead.full_name,
      whatsapp_number: lead.whatsapp_number,
      email: lead.email,
      source: lead.source,
      lead_date: lead.lead_date,
      package_interest: lead.package_interest,
      status: lead.status,
      assigned_to: lead.assigned_to,
      campaign_id: lead.campaign_id,
      budget_idr: lead.budget_idr,
      party_size: lead.party_size,
      travel_date_preference: lead.travel_date_preference,
      notes: lead.notes,
      lead_temperature: lead.lead_temperature,
    },
  };
}

export async function updateLead(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const leadId = getString(formData, "lead_id");
  const returnTo = getLeadFormString(formData, "return_to");
  const fields = parseLeadFormFields(formData);

  if (!leadId) {
    redirect("/leads?error=Lead tidak ditemukan");
  }

  if (!fields.fullName) {
    redirect(
      buildUpdateLeadErrorRedirect(leadId, returnTo, "Nama wajib diisi"),
    );
  }

  const { data: existingLead } = await supabase
    .from("leads")
    .select("status, full_name, assigned_to, organization_id")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existingLead || !canEditLead(profile, existingLead)) {
    redirect(
      buildUpdateLeadErrorRedirect(
        leadId,
        returnTo,
        "Anda tidak memiliki izin untuk mengubah lead ini.",
      ),
    );
  }

  let assignedTo = fields.assignedTo;
  if (!isAdminOrOwner(profile)) {
    assignedTo = profile.id;
  } else if (assignedTo) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!assignee) {
      redirect(
        buildUpdateLeadErrorRedirect(leadId, returnTo, "Assignee tidak valid"),
      );
    }
  }

  const campaignId = await resolveCampaignIdForOrganization(
    supabase,
    profile.organization_id,
    fields.campaignIdInput,
  );

  if (fields.campaignIdInput && !campaignId) {
    redirect(
      buildUpdateLeadErrorRedirect(leadId, returnTo, "Campaign tidak valid"),
    );
  }

  const { data: updatedLead, error } = await supabase
    .from("leads")
    .update({
      full_name: fields.fullName,
      whatsapp_number: fields.whatsappNumber || null,
      phone: fields.whatsappNumber || null,
      email: fields.email || null,
      source: fields.source,
      package_interest: fields.packageInterest || null,
      status: fields.status,
      budget_idr: fields.budgetIdr,
      travel_date_preference: fields.travelDatePreference || null,
      party_size: fields.partySize,
      notes: fields.notes || null,
      assigned_to: assignedTo || null,
      campaign_id: campaignId,
      lead_date: fields.leadDate,
      lead_temperature: fields.leadTemperature,
    })
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      buildUpdateLeadErrorRedirect(
        leadId,
        returnTo,
        formatActionError(error, "updateLead"),
      ),
    );
  }

  if (!updatedLead) {
    redirect(
      buildUpdateLeadErrorRedirect(leadId, returnTo, "Lead tidak ditemukan"),
    );
  }

  const previousStatus = existingLead.status ?? "";
  const statusChanged = Boolean(
    previousStatus && previousStatus !== fields.status,
  );

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: statusChanged ? "status_change" : "note",
    title: statusChanged ? "Status lead berubah" : "Data lead diperbarui",
    body: statusChanged
      ? `Status berubah dari ${previousStatus} menjadi ${fields.status}.`
      : `Data lead ${fields.fullName} diperbarui.`,
  });

  if (statusChanged) {
    await createAutomaticStatusFollowUpTask(
      supabase,
      profile,
      leadId,
      previousStatus,
      fields.status,
    );

    await auditFromProfile(supabase, profile, {
      action: "lead_status_changed",
      entityType: "lead",
      entityId: leadId,
      entityLabel: fields.fullName,
      metadata: {
        from: previousStatus,
        to: fields.status,
        source: "lead_edit",
      },
    });
  } else {
    await auditFromProfile(supabase, profile, {
      action: "lead_updated",
      entityType: "lead",
      entityId: leadId,
      entityLabel: fields.fullName,
    });
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);

  if (returnTo) {
    redirect(
      buildLeadsActionRedirectPath(
        returnTo,
        "success",
        "Lead berhasil diperbarui.",
      ),
    );
  }

  redirect(`/leads/${leadId}`);
}

export async function convertLeadToBooking(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const leadId = getString(formData, "lead_id");

  if (!hasPermission(profile, "bookings.create")) {
    redirect(
      `/leads/${leadId || ""}?error=${encodeURIComponent("You do not have permission to create bookings.")}`,
    );
  }

  if (!leadId) {
    redirect("/leads?error=Lead tidak ditemukan");
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name, package_interest, party_size, organization_id")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    redirect("/leads?error=Lead tidak ditemukan");
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
      `/leads/${leadId}?error=${encodeURIComponent("Lead ini sudah memiliki booking")}`,
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
      `/leads/${leadId}?error=${encodeActionError(error ?? "Gagal membuat booking", "convertLeadToBooking")}`,
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
  redirect(`/bookings/${booking.id}`);
}

export async function snoozeLead(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const clearSnooze = getString(formData, "clear_snooze") === "true";

  if (!leadId) {
    redirect("/leads?error=Lead tidak ditemukan");
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, full_name")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadError || !lead) {
    redirect(`/leads/${leadId}?error=Lead tidak ditemukan`);
  }

  let snoozeUntil: string | null = null;
  let activityBody = "Snooze lead dihapus. Lead kembali muncul di follow-up queue.";

  if (!clearSnooze) {
    const preset = parseSnoozePreset(getString(formData, "snooze_preset"));

    if (!preset) {
      redirect(`/leads/${leadId}?error=Opsi snooze tidak valid`);
    }

    snoozeUntil = resolveSnoozeUntil({
      preset,
      customDate: getString(formData, "snooze_custom_date"),
    });

    if (!snoozeUntil) {
      redirect(`/leads/${leadId}?error=Tanggal snooze wajib diisi`);
    }

    activityBody = `Lead di-snooze hingga ${formatSnoozeUntilLabel(snoozeUntil)}.`;
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      snooze_until: snoozeUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id);

  if (updateError) {
    redirect(
      `/leads/${leadId}?error=${encodeActionError(updateError, "snoozeLead")}`,
    );
  }

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "note",
    title: clearSnooze ? "Snooze Dihapus" : "Lead Di-snooze",
    body: activityBody,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/follow-ups/queue");
  revalidatePath("/dashboard");

  redirect(
    `/leads/${leadId}?success=${encodeURIComponent(clearSnooze ? "Snooze lead dihapus." : "Lead berhasil di-snooze.")}`,
  );
}


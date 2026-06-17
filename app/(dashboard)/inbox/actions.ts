"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { resolveCampaignIdForOrganization } from "@/lib/campaigns/queries";
import {
  getDefaultInboxMetadata,
  parseInboxSource,
  parseInboxStatus,
  type InboxConversationMetadata,
} from "@/lib/inbox/constants";
import { loadInboxConversationRawById } from "@/lib/inbox/queries";
import { mapInboxSourceToLeadSource } from "@/lib/inbox/source-mapping";
import { createAutomaticFirstFollowUpTask } from "@/lib/leads/first-follow-up";
import { getTodayLeadDateValue } from "@/lib/leads/lead-date";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildInboxRedirect(path: string, message: string, isError = false) {
  const param = isError ? "error" : "success";
  return `${path}?${param}=${encodeURIComponent(message)}`;
}

async function requireAdminProfile() {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Hanya owner atau admin yang dapat mengelola inbox.")}`,
    );
  }

  return profile;
}

export async function createInboxConversation(formData: FormData) {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const source = parseInboxSource(getString(formData, "source"));
  const contactName = getString(formData, "contact_name");
  const contactHandle = getString(formData, "contact_handle");
  const lastMessage = getString(formData, "last_message");
  const campaignIdInput = getString(formData, "campaign_id");

  if (!source) {
    redirect(buildInboxRedirect("/inbox", "Source inbox tidak valid.", true));
  }

  if (!contactName) {
    redirect(buildInboxRedirect("/inbox", "Nama kontak wajib diisi.", true));
  }

  const campaignId = await resolveCampaignIdForOrganization(
    supabase,
    profile.organization_id,
    campaignIdInput,
  );

  if (campaignIdInput && !campaignId) {
    redirect(buildInboxRedirect("/inbox", "Campaign tidak valid.", true));
  }

  const metadata = getDefaultInboxMetadata(source);

  const { error } = await supabase.from("inbox_conversations").insert({
    organization_id: profile.organization_id,
    source,
    contact_name: contactName,
    contact_handle: contactHandle || null,
    last_message: lastMessage || null,
    last_message_at: lastMessage ? new Date().toISOString() : null,
    campaign_id: campaignId,
    status: "new",
    metadata,
    created_by: profile.id,
  });

  if (error) {
    redirect(
      buildInboxRedirect(
        "/inbox",
        error.message || "Gagal membuat percakapan inbox.",
        true,
      ),
    );
  }

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  redirect(buildInboxRedirect("/inbox", "Percakapan inbox berhasil ditambahkan."));
}

export async function updateInboxConversationStatus(formData: FormData) {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const conversationId = getString(formData, "conversation_id");
  const status = parseInboxStatus(getString(formData, "status"));

  if (!conversationId) {
    return { success: false, message: "Percakapan tidak ditemukan." };
  }

  if (!status) {
    return { success: false, message: "Status inbox tidak valid." };
  }

  const { data: updated, error } = await supabase
    .from("inbox_conversations")
    .update({ status })
    .eq("id", conversationId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Update inbox status error:", error);
    return { success: false, message: error.message };
  }

  if (!updated) {
    return { success: false, message: "Percakapan tidak ditemukan." };
  }

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/dashboard");

  return { success: true, message: "Status percakapan berhasil diperbarui." };
}

export async function assignInboxConversation(formData: FormData) {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const conversationId = getString(formData, "conversation_id");
  const assignedTo = getString(formData, "assigned_to");

  if (!conversationId) {
    return { success: false, message: "Percakapan tidak ditemukan." };
  }

  if (assignedTo) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!assignee) {
      return { success: false, message: "Sales assignee tidak valid." };
    }
  }

  const { data: updated, error } = await supabase
    .from("inbox_conversations")
    .update({ assigned_to: assignedTo || null })
    .eq("id", conversationId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Assign inbox conversation error:", error);
    return { success: false, message: error.message };
  }

  if (!updated) {
    return { success: false, message: "Percakapan tidak ditemukan." };
  }

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversationId}`);

  return {
    success: true,
    message: assignedTo
      ? "Percakapan berhasil di-assign ke sales."
      : "Assignment percakapan dihapus.",
  };
}

export async function convertInboxConversationToLead(formData: FormData) {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const conversationId = getString(formData, "conversation_id");
  const fullName = getString(formData, "full_name");
  const whatsappNumber = getString(formData, "whatsapp_number");
  const notes = getString(formData, "notes");
  const assignedToInput = getString(formData, "assigned_to");
  const campaignIdInput = getString(formData, "campaign_id");

  if (!conversationId) {
    redirect(buildInboxRedirect("/inbox", "Percakapan tidak ditemukan.", true));
  }

  const conversation = await loadInboxConversationRawById(
    supabase,
    profile.organization_id,
    conversationId,
  );

  if (!conversation) {
    redirect(
      buildInboxRedirect(
        `/inbox/${conversationId}`,
        "Percakapan tidak ditemukan.",
        true,
      ),
    );
  }

  if (conversation.lead_id) {
    redirect(
      buildInboxRedirect(
        `/inbox/${conversationId}`,
        "Percakapan ini sudah dikonversi menjadi lead.",
        true,
      ),
    );
  }

  if (!fullName) {
    redirect(
      buildInboxRedirect(
        `/inbox/${conversationId}`,
        "Nama lead wajib diisi.",
        true,
      ),
    );
  }

  const campaignId =
    (await resolveCampaignIdForOrganization(
      supabase,
      profile.organization_id,
      campaignIdInput || conversation.campaign_id || "",
    )) ?? conversation.campaign_id;

  if (campaignIdInput && !campaignId) {
    redirect(
      buildInboxRedirect(`/inbox/${conversationId}`, "Campaign tidak valid.", true),
    );
  }

  const assignedTo = assignedToInput || conversation.assigned_to || null;

  if (assignedTo) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!assignee) {
      redirect(
        buildInboxRedirect(
          `/inbox/${conversationId}`,
          "Sales assignee tidak valid.",
          true,
        ),
      );
    }
  }

  const existingMetadata = (conversation.metadata ?? {}) as InboxConversationMetadata;
  const resolvedWhatsapp =
    whatsappNumber || existingMetadata.whatsapp_number || null;

  const { data: createdLead, error: leadError } = await supabase
    .from("leads")
    .insert({
      organization_id: profile.organization_id,
      full_name: fullName,
      whatsapp_number: resolvedWhatsapp,
      phone: resolvedWhatsapp,
      source: mapInboxSourceToLeadSource(conversation.source),
      campaign_id: campaignId,
      notes: notes || conversation.last_message || null,
      status: "new",
      priority: "medium",
      interest_type: "halal_tour",
      assigned_to: assignedTo,
      lead_date: getTodayLeadDateValue(),
      metadata: {
        inbox_conversation_id: conversation.id,
        inbox_source: conversation.source,
      },
    })
    .select("id")
    .single();

  if (leadError || !createdLead) {
    redirect(
      buildInboxRedirect(
        `/inbox/${conversationId}`,
        leadError?.message ?? "Gagal membuat lead dari inbox.",
        true,
      ),
    );
  }

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: createdLead.id,
    actor_id: profile.id,
    activity_type: "note",
    title: "Lead dari Inbox",
    body: `Lead dibuat dari percakapan ${conversation.source} (${conversation.contact_name}).`,
    metadata: {
      inbox_conversation_id: conversation.id,
    },
  });

  await createAutomaticFirstFollowUpTask(supabase, profile, createdLead.id);

  const { error: conversationUpdateError } = await supabase
    .from("inbox_conversations")
    .update({
      lead_id: createdLead.id,
      status: "converted",
      assigned_to: assignedTo,
      campaign_id: campaignId,
      metadata: {
        ...existingMetadata,
        whatsapp_number: resolvedWhatsapp,
      },
    })
    .eq("id", conversationId)
    .eq("organization_id", profile.organization_id);

  if (conversationUpdateError) {
    redirect(
      buildInboxRedirect(
        `/inbox/${conversationId}`,
        conversationUpdateError.message,
        true,
      ),
    );
  }

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/leads");
  revalidatePath(`/leads/${createdLead.id}`);
  revalidatePath("/dashboard");

  redirect(
    buildInboxRedirect(
      `/inbox/${conversationId}`,
      "Lead berhasil dibuat dari percakapan inbox.",
    ),
  );
}

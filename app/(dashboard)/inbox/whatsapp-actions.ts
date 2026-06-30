"use server";

import { revalidatePath } from "next/cache";

import {
  canAddOmnichannelConversationNote,
  canConvertOmnichannelConversationToLead,
  canCreateInboxFollowUpFromLead,
  canReassignOmnichannelConversation,
  canUpdateOmnichannelConversationStatus,
} from "@/lib/omnichannel-inbox/permissions";
import { buildInboxConvertNotesDefault } from "@/components/omnichannel-inbox/inbox-display";
import {
  combineInboxFollowUpDueDateTime,
  formatInboxFollowUpDueDateTime,
  parseInboxFollowUpPriority,
} from "@/lib/omnichannel-inbox/inbox-follow-up";
import { mapOmnichannelChannelToLeadSource } from "@/lib/omnichannel-inbox/source-mapping";
import { createAutomaticFirstFollowUpTask } from "@/lib/leads/first-follow-up";
import { getTodayLeadDateValue } from "@/lib/leads/lead-date";
import { parseLeadFormFields } from "@/lib/leads/lead-form-parsing";
import { auditFromProfile } from "@/lib/audit";
import { requireProfile } from "@/lib/auth/session";
import { findWhatsappConversationById } from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import {
  addWhatsappConversationNote,
  assignWhatsappConversation,
  updateWhatsappConversationStatus,
} from "@/lib/whatsapp-inbox/service";
import { markWhatsappConversationAsRead as markWhatsappConversationAsReadInRepo } from "@/lib/whatsapp-inbox/repository";
import { resolveWhatsappContactDisplay } from "@/lib/whatsapp-inbox/display";
import {
  getWhatsappSendReplyErrorMessage,
  retryWhatsappConversationReply,
  sendWhatsappConversationReply,
} from "@/lib/whatsapp-inbox/send-reply";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
};

type ConvertLeadResult = ActionResult & {
  leadId?: string;
};

type CreateFollowUpResult = ActionResult & {
  followUpTaskId?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateInbox(conversationId?: string) {
  revalidatePath("/inbox");
  if (conversationId) {
    revalidatePath(`/inbox?c=${conversationId}`);
  }
}

function getWhatsappConversationAuditLabel(
  conversation: Pick<WhatsappConversationRow, "id" | "contact_name" | "phone_number">,
) {
  const contact = resolveWhatsappContactDisplay(conversation);
  return contact.primaryName || conversation.id;
}

async function requireWhatsappConversationAccess(conversationId: string) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const conversation = await findWhatsappConversationById(
    supabase,
    profile.organization_id,
    conversationId,
  );

  if (!conversation) {
    throw new Error("Conversation tidak ditemukan.");
  }

  return { profile, supabase, conversation };
}

export async function markWhatsappConversationAsRead(
  conversationId: string,
): Promise<ActionResult> {
  if (!conversationId.trim()) {
    return { success: false, message: "Conversation wajib dipilih." };
  }

  try {
    const { profile, supabase } =
      await requireWhatsappConversationAccess(conversationId);

    await markWhatsappConversationAsReadInRepo(
      supabase,
      profile.organization_id,
      conversationId,
    );

    revalidateInbox(conversationId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menandai percakapan WhatsApp sebagai dibaca.",
    };
  }
}

export async function assignWhatsappConversationAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const assignedUserId = getString(formData, "assigned_user_id");

  if (!conversationId) {
    return { success: false, message: "Conversation wajib dipilih." };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWhatsappConversationAccess(conversationId);

    if (!canReassignOmnichannelConversation(profile)) {
      return {
        success: false,
        message: "Hanya owner atau admin yang dapat mengassign conversation.",
      };
    }

    await assignWhatsappConversation(
      supabase,
      profile.organization_id,
      conversationId,
      assignedUserId || null,
      profile.id,
    );

    await auditFromProfile(supabase, profile, {
      action: "conversation_assigned",
      entityType: "inbox",
      entityId: conversationId,
      entityLabel: getWhatsappConversationAuditLabel(conversation),
      metadata: {
        assigned_user_id: assignedUserId || null,
        channel: "whatsapp",
      },
    });

    revalidateInbox(conversationId);
    return { success: true, message: "Conversation berhasil di-assign." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengassign conversation.",
    };
  }
}

export async function updateWhatsappConversationStatusAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const status = getString(formData, "status");

  if (!conversationId || !status) {
    return { success: false, message: "Conversation dan status wajib diisi." };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWhatsappConversationAccess(conversationId);

    if (
      !canUpdateOmnichannelConversationStatus(profile, {
        assigned_user_id: conversation.assigned_user_id,
      })
    ) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk mengubah status conversation ini.",
      };
    }

    await updateWhatsappConversationStatus(
      supabase,
      profile.organization_id,
      conversationId,
      status,
    );

    await auditFromProfile(supabase, profile, {
      action: "conversation_status_changed",
      entityType: "inbox",
      entityId: conversationId,
      entityLabel: getWhatsappConversationAuditLabel(conversation),
      metadata: {
        from: conversation.status,
        to: status,
        channel: "whatsapp",
      },
    });

    revalidateInbox(conversationId);
    return { success: true, message: "Status conversation diperbarui." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status conversation.",
    };
  }
}

export async function addWhatsappConversationNoteAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const note = getString(formData, "note");

  if (!conversationId || !note) {
    return { success: false, message: "Conversation dan catatan wajib diisi." };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWhatsappConversationAccess(conversationId);

    if (
      !canAddOmnichannelConversationNote(profile, {
        assigned_user_id: conversation.assigned_user_id,
      })
    ) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk menambah catatan.",
      };
    }

    await addWhatsappConversationNote(supabase, profile.organization_id, {
      conversationId,
      note,
      createdBy: profile.id,
    });

    await auditFromProfile(supabase, profile, {
      action: "note_added",
      entityType: "inbox",
      entityId: conversationId,
      entityLabel: getWhatsappConversationAuditLabel(conversation),
      metadata: { channel: "whatsapp" },
    });

    revalidateInbox(conversationId);
    return { success: true, message: "Catatan internal disimpan." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan catatan.",
    };
  }
}

export async function convertWhatsappConversationToLead(
  formData: FormData,
): Promise<ConvertLeadResult> {
  const conversationId = getString(formData, "conversation_id");

  if (!conversationId) {
    return { success: false, message: "Conversation wajib dipilih." };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWhatsappConversationAccess(conversationId);

    if (
      !canConvertOmnichannelConversationToLead(profile, {
        assigned_user_id: conversation.assigned_user_id,
      })
    ) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk mengonversi conversation ini.",
      };
    }

    if (conversation.customer_id) {
      return {
        success: false,
        message: "Conversation ini sudah dikonversi menjadi lead.",
      };
    }

    const fields = parseLeadFormFields(formData);

    if (!fields.fullName) {
      return { success: false, message: "Nama lead wajib diisi." };
    }

    const assignedTo =
      fields.assignedTo || conversation.assigned_user_id || null;

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

    const [{ data: firstIncomingMessage }, { data: lastIncomingMessage }] =
      await Promise.all([
        supabase
          .from("whatsapp_messages")
          .select("text")
          .eq("conversation_id", conversationId)
          .eq("direction", "incoming")
          .order("timestamp", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("whatsapp_messages")
          .select("text")
          .eq("conversation_id", conversationId)
          .eq("direction", "incoming")
          .order("timestamp", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const defaultNotes =
      fields.notes ||
      buildInboxConvertNotesDefault([
        ...(firstIncomingMessage?.text
          ? [
              {
                direction: "incoming",
                message_text: firstIncomingMessage.text,
              },
            ]
          : []),
        ...(lastIncomingMessage?.text &&
        lastIncomingMessage.text !== firstIncomingMessage?.text
          ? [
              {
                direction: "incoming",
                message_text: lastIncomingMessage.text,
              },
            ]
          : []),
      ]) ||
      null;

    const phoneNumber =
      fields.whatsappNumber || conversation.phone_number || null;

    const { data: createdLead, error: leadError } = await supabase
      .from("leads")
      .insert({
        organization_id: profile.organization_id,
        full_name: fields.fullName,
        whatsapp_number: phoneNumber,
        phone: phoneNumber,
        email: fields.email || null,
        source: mapOmnichannelChannelToLeadSource("whatsapp"),
        package_interest: fields.packageInterest || null,
        travel_date_preference: fields.travelDatePreference || null,
        party_size: fields.partySize,
        budget_idr: fields.budgetIdr,
        notes: defaultNotes,
        status: "new",
        priority: "medium",
        interest_type: "halal_tour",
        assigned_to: assignedTo,
        lead_date: fields.leadDateForCreate || getTodayLeadDateValue(),
        metadata: {
          whatsapp_conversation_id: conversation.id,
          omnichannel_channel: "whatsapp",
          ai_extraction: null,
        },
      })
      .select("id")
      .single();

    if (leadError || !createdLead) {
      return {
        success: false,
        message: leadError?.message ?? "Gagal membuat lead dari inbox.",
      };
    }

    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: createdLead.id,
      actor_id: profile.id,
      activity_type: "note",
      title: "Lead converted from inbox",
      body: "Lead created from WhatsApp conversation.",
      metadata: {
        whatsapp_conversation_id: conversation.id,
      },
    });

    await createAutomaticFirstFollowUpTask(supabase, profile, createdLead.id);

    const { error: conversationUpdateError } = await supabase
      .from("whatsapp_conversations")
      .update({
        customer_id: createdLead.id,
        assigned_user_id: assignedTo,
        status: "following_up",
      })
      .eq("id", conversationId)
      .eq("workspace_id", profile.organization_id);

    if (conversationUpdateError) {
      return {
        success: false,
        message: conversationUpdateError.message,
      };
    }

    await auditFromProfile(supabase, profile, {
      action: "conversation_converted_to_lead",
      entityType: "inbox",
      entityId: conversationId,
      entityLabel: getWhatsappConversationAuditLabel(conversation),
      metadata: {
        lead_id: createdLead.id,
        channel: "whatsapp",
      },
    });

    revalidateInbox(conversationId);
    revalidatePath("/leads");
    revalidatePath(`/leads/${createdLead.id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Lead berhasil dibuat dari conversation.",
      leadId: createdLead.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengonversi conversation menjadi lead.",
    };
  }
}

export async function createWhatsappInboxFollowUpTask(
  formData: FormData,
): Promise<CreateFollowUpResult> {
  const conversationId = getString(formData, "conversation_id");
  const leadId = getString(formData, "lead_id");
  const title = getString(formData, "title");
  const dueDate = getString(formData, "due_date");
  const dueTime = getString(formData, "due_time");
  const assignedTo = getString(formData, "assigned_to");
  const priority = parseInboxFollowUpPriority(getString(formData, "priority"));
  const notes = getString(formData, "notes");

  if (!conversationId || !leadId) {
    return { success: false, message: "Conversation and lead are required." };
  }

  if (!title) {
    return { success: false, message: "Follow up title is required." };
  }

  const dueDateTime = combineInboxFollowUpDueDateTime(dueDate, dueTime);
  if (!dueDateTime) {
    return { success: false, message: "Valid due date and time are required." };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWhatsappConversationAccess(conversationId);

    if (
      !canCreateInboxFollowUpFromLead(profile, {
        assigned_user_id: conversation.assigned_user_id,
      })
    ) {
      return {
        success: false,
        message: "You do not have permission to create a follow up here.",
      };
    }

    if (conversation.customer_id !== leadId) {
      return {
        success: false,
        message: "This conversation is not linked to the selected lead.",
      };
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, assigned_to, full_name")
      .eq("id", leadId)
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!lead) {
      return { success: false, message: "Lead not found." };
    }

    if (assignedTo) {
      const { data: assignee } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", assignedTo)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();

      if (!assignee) {
        return { success: false, message: "Assigned user is not valid." };
      }
    }

    const { data: createdTask, error: taskError } = await supabase
      .from("follow_up_tasks")
      .insert({
        organization_id: profile.organization_id,
        lead_id: leadId,
        title,
        description: notes || null,
        due_date: dueDateTime,
        status: "pending",
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (taskError || !createdTask) {
      return {
        success: false,
        message: taskError?.message ?? "Failed to create follow up task.",
      };
    }

    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: "note",
      title: "Follow up created",
      body: `${title} scheduled for ${formatInboxFollowUpDueDateTime(dueDateTime)}.`,
      metadata: {
        follow_up_task_id: createdTask.id,
        priority,
        assigned_to: assignedTo || null,
        whatsapp_conversation_id: conversationId,
        source: "inbox",
      },
    });

    await auditFromProfile(supabase, profile, {
      action: "follow_up_created",
      entityType: "lead",
      entityId: leadId,
      entityLabel: lead.full_name,
      metadata: {
        source: "inbox",
        task_id: createdTask.id,
        conversation_id: conversationId,
        channel: "whatsapp",
      },
    });

    if (assignedTo && !lead.assigned_to) {
      await supabase
        .from("leads")
        .update({ assigned_to: assignedTo })
        .eq("id", leadId)
        .eq("organization_id", profile.organization_id);
    }

    revalidateInbox(conversationId);
    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/follow-ups");
    revalidatePath("/follow-ups/queue");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Follow up scheduled successfully.",
      followUpTaskId: createdTask.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create follow up from inbox.",
    };
  }
}

type SendReplyResult = ActionResult & {
  messageId?: string;
};

export async function sendWhatsappConversationReplyAction(
  formData: FormData,
): Promise<SendReplyResult> {
  const conversationId = getString(formData, "conversation_id");
  const messageText = getString(formData, "message_text");

  if (!conversationId || !messageText) {
    return {
      success: false,
      message: "Conversation dan pesan wajib diisi.",
    };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWhatsappConversationAccess(conversationId);

    const savedMessage = await sendWhatsappConversationReply(
      supabase,
      profile.organization_id,
      profile,
      conversationId,
      messageText,
    );

    await auditFromProfile(supabase, profile, {
      action: "reply_sent",
      entityType: "inbox",
      entityId: conversationId,
      entityLabel: getWhatsappConversationAuditLabel(conversation),
      metadata: {
        message_id: savedMessage.id,
        channel: "whatsapp",
      },
    });

    revalidateInbox(conversationId);

    return {
      success: true,
      message: "Pesan WhatsApp terkirim.",
      messageId: savedMessage.id,
    };
  } catch (error) {
    return {
      success: false,
      message: getWhatsappSendReplyErrorMessage(error),
    };
  }
}

export async function retryWhatsappConversationReplyAction(
  formData: FormData,
): Promise<SendReplyResult> {
  const messageId = getString(formData, "message_id");

  if (!messageId) {
    return { success: false, message: "Message ID wajib diisi." };
  }

  try {
    const { profile } = await requireProfile();
    const supabase = await createClient();

    const savedMessage = await retryWhatsappConversationReply(
      supabase,
      profile.organization_id,
      profile,
      messageId,
    );

    revalidateInbox(savedMessage.conversationId);

    return {
      success: true,
      message: "Pesan WhatsApp terkirim.",
      messageId: savedMessage.id,
    };
  } catch (error) {
    return {
      success: false,
      message: getWhatsappSendReplyErrorMessage(error),
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";

import {
  canAddOmnichannelConversationNote,
  canReassignOmnichannelConversation,
  canReplyToOmnichannelConversation,
  canUpdateOmnichannelConversationStatus,
} from "@/lib/omnichannel-inbox/permissions";
import { findConversationById } from "@/lib/omnichannel-inbox/repository";
import {
  getOmnichannelSendReplyErrorMessage,
  sendConversationReply,
} from "@/lib/omnichannel-inbox/send-reply";
import {
  addNote,
  assignConversation,
  updateConversationStatus,
} from "@/lib/omnichannel-inbox/service";
import { markConversationAsRead } from "@/lib/omnichannel-inbox/repository";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
};

type SendReplyResult = ActionResult & {
  messageId?: string;
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

async function requireConversationAccess(conversationId: string) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const conversation = await findConversationById(
    supabase,
    profile.organization_id,
    conversationId,
  );

  if (!conversation) {
    throw new Error("Conversation tidak ditemukan.");
  }

  return { profile, supabase, conversation };
}

export async function assignOmnichannelConversation(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const assignedUserId = getString(formData, "assigned_user_id");

  if (!conversationId) {
    return { success: false, message: "Conversation wajib dipilih." };
  }

  try {
    const { profile, supabase } = await requireConversationAccess(conversationId);

    if (!canReassignOmnichannelConversation(profile)) {
      return {
        success: false,
        message: "Hanya owner atau admin yang dapat mengassign conversation.",
      };
    }

    await assignConversation(
      supabase,
      profile.organization_id,
      conversationId,
      assignedUserId || null,
    );

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

export async function updateOmnichannelConversationStatus(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const status = getString(formData, "status");

  if (!conversationId || !status) {
    return { success: false, message: "Conversation dan status wajib diisi." };
  }

  try {
    const { profile, supabase, conversation } =
      await requireConversationAccess(conversationId);

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

    await updateConversationStatus(
      supabase,
      profile.organization_id,
      conversationId,
      status,
    );

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

export async function addOmnichannelConversationNote(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const note = getString(formData, "note");

  if (!conversationId || !note) {
    return { success: false, message: "Conversation dan catatan wajib diisi." };
  }

  try {
    const { profile, supabase, conversation } =
      await requireConversationAccess(conversationId);

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

    await addNote(supabase, profile.organization_id, {
      conversationId,
      note,
      createdBy: profile.id,
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

export async function markOmnichannelConversationAsRead(
  conversationId: string,
): Promise<ActionResult> {
  if (!conversationId.trim()) {
    return { success: false, message: "Conversation wajib dipilih." };
  }

  try {
    const { profile, supabase } = await requireConversationAccess(conversationId);

    await markConversationAsRead(
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
          : "Gagal menandai conversation sebagai dibaca.",
    };
  }
}

export async function sendOmnichannelConversationReply(
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
    const { profile, supabase } = await requireConversationAccess(conversationId);
    const savedMessage = await sendConversationReply(
      supabase,
      profile.organization_id,
      profile,
      conversationId,
      messageText,
    );

    revalidateInbox(conversationId);

    return {
      success: true,
      message: "Reply sent.",
      messageId: savedMessage.id,
    };
  } catch (error) {
    return {
      success: false,
      message: getOmnichannelSendReplyErrorMessage(error),
    };
  }
}

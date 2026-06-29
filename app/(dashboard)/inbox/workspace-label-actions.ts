"use server";

import { revalidatePath } from "next/cache";

import { pickWorkspaceLabelColor } from "@/lib/omnichannel-inbox/constants";
import { requireProfile } from "@/lib/auth/session";
import { findConversationById } from "@/lib/omnichannel-inbox/repository";
import { findWhatsappConversationById } from "@/lib/whatsapp-inbox/repository";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
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

async function resolveConversationChannel(
  organizationId: string,
  conversationId: string,
) {
  const supabase = await createClient();
  const whatsapp = await findWhatsappConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (whatsapp) {
    return { channel: "whatsapp" as const, supabase };
  }

  const omnichannel = await findConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (omnichannel) {
    return { channel: omnichannel.channel, supabase };
  }

  return null;
}

export async function addWorkspaceConversationLabel(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const tag = getString(formData, "tag");

  if (!conversationId || !tag) {
    return { success: false, message: "Conversation and label are required." };
  }

  try {
    const { profile } = await requireProfile();
    const resolved = await resolveConversationChannel(
      profile.organization_id,
      conversationId,
    );

    if (!resolved) {
      return { success: false, message: "Conversation not found." };
    }

    const color = pickWorkspaceLabelColor(tag);
    const table =
      resolved.channel === "whatsapp"
        ? "whatsapp_conversation_tags"
        : "conversation_tags";

    const { error } = await resolved.supabase.from(table).insert({
      conversation_id: conversationId,
      tag,
      color,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidateInbox(conversationId);
    return { success: true, message: "Label added." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add label.",
    };
  }
}

export async function removeWorkspaceConversationLabel(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const tag = getString(formData, "tag");

  if (!conversationId || !tag) {
    return { success: false, message: "Conversation and label are required." };
  }

  try {
    const { profile } = await requireProfile();
    const resolved = await resolveConversationChannel(
      profile.organization_id,
      conversationId,
    );

    if (!resolved) {
      return { success: false, message: "Conversation not found." };
    }

    const table =
      resolved.channel === "whatsapp"
        ? "whatsapp_conversation_tags"
        : "conversation_tags";

    const { error } = await resolved.supabase
      .from(table)
      .delete()
      .eq("conversation_id", conversationId)
      .eq("tag", tag);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidateInbox(conversationId);
    return { success: true, message: "Label removed." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to remove label.",
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/session";
import { markWhatsappConversationAsRead as markWhatsappConversationAsReadInRepo } from "@/lib/whatsapp-inbox/repository";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
};

export async function markWhatsappConversationAsRead(
  conversationId: string,
): Promise<ActionResult> {
  if (!conversationId.trim()) {
    return { success: false, message: "Conversation wajib dipilih." };
  }

  try {
    const { profile } = await requireProfile();
    const supabase = await createClient();

    await markWhatsappConversationAsReadInRepo(
      supabase,
      profile.organization_id,
      conversationId,
    );

    revalidatePath("/inbox");
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

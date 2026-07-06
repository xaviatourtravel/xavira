"use server";

import { revalidatePath } from "next/cache";

import { actionEngine } from "@/modules/ai/action-engine";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { memoryService } from "@/modules/ai/services/memory-service";
import { requireProfile } from "@/lib/auth/session";
import { findWhatsappConversationById } from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
};

const AI_ACTIONS_PATH = "/ai-actions";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateAiActions(conversationId?: string) {
  revalidatePath(AI_ACTIONS_PATH);
  revalidatePath("/inbox");
  if (conversationId) {
    revalidatePath(`/inbox?c=${conversationId}`);
  }
}

async function requireWorkspaceConversation(conversationId: string) {
  const { profile } = await requireProfile();

  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }

  const supabase = await createClient();
  const conversation = await findWhatsappConversationById(
    supabase,
    profile.organization_id,
    conversationId,
  );

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  return { profile, supabase, conversation };
}

async function buildActionEngineContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  conversation: WhatsappConversationRow,
) {
  const [leadQualification, conversationMemory] = await Promise.all([
    leadQualificationService.getQualification(supabase, conversation.id),
    memoryService.getMemory(supabase, conversation.id),
  ]);

  return {
    supabase,
    workspaceId,
    conversation,
    leadQualification,
    conversationMemory,
  };
}

export async function approveWorkspaceAiActionAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const actionId = getString(formData, "action_id");

  if (!conversationId || !actionId) {
    return {
      success: false,
      message: "Conversation and action are required.",
    };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWorkspaceConversation(conversationId);

    const context = await buildActionEngineContext(
      supabase,
      profile.organization_id!,
      conversation,
    );

    const result = await actionEngine.approveActionManually(actionId, context, {
      approvedByUserId: profile.id,
    });

    revalidateAiActions(conversationId);

    if (result.status === "EXECUTED") {
      return { success: true, message: "Action approved and executed." };
    }

    if (result.status === "FAILED") {
      return {
        success: false,
        message: result.error ?? "Action approved but execution failed.",
      };
    }

    if (result.status === "REJECTED") {
      return {
        success: false,
        message: result.validationReason ?? "Action could not be approved.",
      };
    }

    return { success: true, message: "Action approved." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to approve action.",
    };
  }
}

export async function rejectWorkspaceAiActionAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const actionId = getString(formData, "action_id");
  const rejectionReason = getString(formData, "rejection_reason");

  if (!conversationId || !actionId) {
    return {
      success: false,
      message: "Conversation and action are required.",
    };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWorkspaceConversation(conversationId);

    const context = await buildActionEngineContext(
      supabase,
      profile.organization_id!,
      conversation,
    );

    await actionEngine.rejectActionManually(actionId, context, {
      rejectionReason: rejectionReason || "Rejected by teammate",
      rejectedByUserId: profile.id,
    });

    revalidateAiActions(conversationId);
    return { success: true, message: "Action rejected." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reject action.",
    };
  }
}

export async function retryWorkspaceAiActionAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const actionId = getString(formData, "action_id");

  if (!conversationId || !actionId) {
    return {
      success: false,
      message: "Conversation and action are required.",
    };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWorkspaceConversation(conversationId);

    const context = await buildActionEngineContext(
      supabase,
      profile.organization_id!,
      conversation,
    );

    const result = await actionEngine.retryFailedAction(actionId, context, {
      retriedByUserId: profile.id,
    });

    revalidateAiActions(conversationId);

    if (result.status === "EXECUTED") {
      return { success: true, message: "Action retried and executed." };
    }

    return {
      success: false,
      message:
        result.error ??
        result.validationReason ??
        "Action retry failed. Check the error and try again.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to retry action.",
    };
  }
}

export async function cancelScheduledWorkspaceAiActionAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const actionId = getString(formData, "action_id");
  const reason = getString(formData, "cancellation_reason");

  if (!conversationId || !actionId) {
    return {
      success: false,
      message: "Conversation and action are required.",
    };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWorkspaceConversation(conversationId);

    const context = await buildActionEngineContext(
      supabase,
      profile.organization_id!,
      conversation,
    );

    await actionEngine.cancelScheduledAction(actionId, context, {
      cancelledByUserId: profile.id,
      reason: reason || undefined,
    });

    revalidateAiActions(conversationId);
    return { success: true, message: "Scheduled action cancelled." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to cancel action.",
    };
  }
}

export async function executeScheduledWorkspaceAiActionNowAction(
  formData: FormData,
): Promise<ActionResult> {
  const conversationId = getString(formData, "conversation_id");
  const actionId = getString(formData, "action_id");

  if (!conversationId || !actionId) {
    return {
      success: false,
      message: "Conversation and action are required.",
    };
  }

  try {
    const { profile, supabase, conversation } =
      await requireWorkspaceConversation(conversationId);

    const context = await buildActionEngineContext(
      supabase,
      profile.organization_id!,
      conversation,
    );

    const result = await actionEngine.executeScheduledActionNow(
      actionId,
      context,
      { executedByUserId: profile.id },
    );

    revalidateAiActions(conversationId);

    if (result.status === "EXECUTED") {
      return { success: true, message: "Action executed." };
    }

    return {
      success: false,
      message: result.error ?? "Action could not be executed.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to execute action.",
    };
  }
}

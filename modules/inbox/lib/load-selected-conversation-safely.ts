import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { loadOmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { loadWhatsappConversationDetail } from "@/lib/whatsapp-inbox/queries";
import { createClient } from "@/utils/supabase/server";
import {
  createInboxDiagnosticId,
  isValidConversationIdShape,
  logInboxFailure,
  logInboxWarning,
  type SafeConversationLoadResult,
} from "@/modules/inbox/lib/inbox-observability";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads a selected conversation for `/inbox?c=`.
 * Never throws — failures become not_found / error with a diagnostic ID.
 * Cross-workspace and missing IDs both resolve to not_found (no leak).
 */
export async function loadSelectedConversationSafely(params: {
  supabase: SupabaseServerClient;
  organizationId: string;
  conversationId: string | null;
}): Promise<
  SafeConversationLoadResult & {
    detail?: OmnichannelConversationDetail | null;
  }
> {
  const { supabase, organizationId, conversationId } = params;

  if (!conversationId) {
    return { status: "none" };
  }

  const diagnosticId = createInboxDiagnosticId();

  if (!isValidConversationIdShape(conversationId)) {
    logInboxWarning({
      operation: "load_conversation",
      stage: "validate_conversation_id",
      diagnosticId,
      conversationId,
      organizationId,
      message: "Malformed conversation id in ?c=",
    });
    return { status: "invalid_id", diagnosticId };
  }

  try {
    const whatsappDetail = await loadWhatsappConversationDetail(
      supabase,
      organizationId,
      conversationId,
    );

    if (whatsappDetail) {
      return { status: "ok", detail: whatsappDetail };
    }

    const omnichannelDetail = await loadOmnichannelConversationDetail(
      supabase,
      organizationId,
      conversationId,
    );

    if (omnichannelDetail) {
      return { status: "ok", detail: omnichannelDetail };
    }

    // Missing or other-org: identical not_found (no existence leak).
    logInboxWarning({
      operation: "load_conversation",
      stage: "load_conversation",
      diagnosticId,
      conversationId,
      organizationId,
      message: "Conversation not found for workspace",
    });
    return { status: "not_found", diagnosticId };
  } catch (error) {
    logInboxFailure({
      operation: "load_conversation",
      stage: "load_conversation",
      diagnosticId,
      conversationId,
      organizationId,
      error,
      message: "Unexpected failure loading conversation detail",
    });
    return { status: "error", diagnosticId };
  }
}

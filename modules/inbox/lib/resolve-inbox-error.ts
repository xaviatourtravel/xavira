import type { InboxKey } from "@/lib/i18n/inbox-dictionary";

export function logInboxError(context: string, raw?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[inbox] ${context}`, raw);
  }
}

type SendErrorCopy = {
  titleKey: InboxKey;
  descriptionKey: InboxKey;
};

export function resolveComposerSendError(code: string): SendErrorCopy {
  switch (code) {
    case "service_unavailable":
      return {
        titleKey: "errorSendWhatsappNotConnectedTitle",
        descriptionKey: "errorSendWhatsappNotConnectedDesc",
      };
    case "instance_disconnected":
      return {
        titleKey: "errorSendWhatsappDisconnectedTitle",
        descriptionKey: "errorSendWhatsappDisconnectedDesc",
      };
    case "permission_denied":
      return {
        titleKey: "errorSendPermissionDeniedTitle",
        descriptionKey: "errorSendPermissionDeniedDesc",
      };
    case "conversation_not_found":
      return {
        titleKey: "errorSendConversationNotFoundTitle",
        descriptionKey: "errorSendConversationNotFoundDesc",
      };
    default:
      return {
        titleKey: "composerSendFailed",
        descriptionKey: "composerTryAgain",
      };
  }
}

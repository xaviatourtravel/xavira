import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";

export function formatWhatsappPhoneDisplay(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (!digits) {
    return phoneNumber;
  }

  if (digits.startsWith("62") && digits.length >= 10) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `+62${digits.slice(1)}`;
  }

  return `+${digits}`;
}

export type WhatsappContactDisplay = {
  primaryName: string;
  secondaryLabel: string | null;
  avatarName: string;
};

export function resolveWhatsappContactDisplay(
  conversation: Pick<WhatsappConversationRow, "contact_name" | "phone_number">,
): WhatsappContactDisplay {
  const pushName = conversation.contact_name?.trim() || null;
  const phoneLabel = formatWhatsappPhoneDisplay(conversation.phone_number);

  if (pushName) {
    return {
      primaryName: pushName,
      secondaryLabel: phoneLabel,
      avatarName: pushName,
    };
  }

  return {
    primaryName: phoneLabel,
    secondaryLabel: null,
    avatarName: phoneLabel,
  };
}

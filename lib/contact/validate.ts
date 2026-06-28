import { isContactTopic } from "@/lib/contact/constants";
import { isValidPhone, isValidWorkEmail } from "@/lib/demo/validate";

export type ContactMessageInput = {
  fullName: string;
  email: string;
  companyName: string;
  topic: string;
  message: string;
  honeypot: string;
};

export type ContactMessageErrorCode =
  | "missing_fields"
  | "invalid_email"
  | "invalid_topic"
  | "message_too_short";

export type ContactMessageValidationResult =
  | { ok: true; data: ContactMessageInput }
  | { ok: false; errorCode: ContactMessageErrorCode };

function getTrimmed(value: string | undefined) {
  return value?.trim() ?? "";
}

export function validateContactMessageInput(raw: {
  fullName?: string;
  email?: string;
  companyName?: string;
  topic?: string;
  message?: string;
  honeypot?: string;
}): ContactMessageValidationResult {
  const fullName = getTrimmed(raw.fullName);
  const email = getTrimmed(raw.email);
  const companyName = getTrimmed(raw.companyName);
  const topic = getTrimmed(raw.topic);
  const message = getTrimmed(raw.message);
  const honeypot = getTrimmed(raw.honeypot);

  if (!fullName || !email || !topic || !message) {
    return { ok: false, errorCode: "missing_fields" };
  }

  if (!isValidWorkEmail(email)) {
    return { ok: false, errorCode: "invalid_email" };
  }

  if (!isContactTopic(topic)) {
    return { ok: false, errorCode: "invalid_topic" };
  }

  if (message.length < 10) {
    return { ok: false, errorCode: "message_too_short" };
  }

  return {
    ok: true,
    data: {
      fullName,
      email,
      companyName,
      topic,
      message,
      honeypot,
    },
  };
}

export function getContactMessageErrorMessage(code: ContactMessageErrorCode) {
  switch (code) {
    case "missing_fields":
      return "Lengkapi nama, email, topik, dan pesan Anda.";
    case "invalid_email":
      return "Format email tidak valid.";
    case "invalid_topic":
      return "Pilih topik yang valid.";
    case "message_too_short":
      return "Pesan terlalu singkat. Tulis minimal 10 karakter.";
    default:
      return "Terjadi kesalahan. Silakan coba lagi.";
  }
}

// Re-export for phone if needed later
export { isValidPhone };

/**
 * Normalize WhatsApp phone to digits only (e.g. 628xxx).
 * Strips @s.whatsapp.net, +, spaces, and other non-digits.
 */
export function normalizeWhatsappPhoneDigits(phoneNumber: string) {
  const withoutJid = phoneNumber.trim().split("@")[0] ?? phoneNumber;
  return withoutJid.replace(/\D/g, "");
}

export function buildWhatsappRemoteJid(phoneDigits: string) {
  return `${phoneDigits}@s.whatsapp.net`;
}

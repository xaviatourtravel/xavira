import type { SmartReplyConfig } from "./types";

export function buildMockSmartReplyConfig(): SmartReplyConfig {
  return {
    suggestionAvailable: true,
    suggestion: {
      preview:
        "Berdasarkan kebutuhan Kakak, kami merekomendasikan paket Yunnan Premium dengan itinerary halal-friendly. Budget yang Kakak sebutkan masih sesuai untuk keberangkatan Mei dengan 2 orang. Mau saya kirimkan detail quotation lengkapnya sekarang?",
    },
    quickActions: [
      { id: "ai-reply", label: "AI Reply", emoji: "✨" },
      { id: "template", label: "Template", emoji: "📄" },
      { id: "package", label: "Package", emoji: "📦" },
      { id: "itinerary", label: "Itinerary", emoji: "🗓" },
      { id: "quotation", label: "Quotation", emoji: "💰" },
      { id: "translate", label: "Translate", emoji: "🌍" },
      { id: "rewrite", label: "Rewrite", emoji: "✍" },
    ],
    commands: [
      {
        id: "template",
        command: "/template",
        icon: "file-text",
        title: "Template",
        description: "Insert a saved reply template",
        keyboardHint: "T",
      },
      {
        id: "package",
        command: "/package",
        icon: "package",
        title: "Package",
        description: "Share a travel package summary",
        keyboardHint: "P",
      },
      {
        id: "quotation",
        command: "/quotation",
        icon: "wallet",
        title: "Quotation",
        description: "Generate a quotation message",
        keyboardHint: "Q",
      },
      {
        id: "itinerary",
        command: "/itinerary",
        icon: "calendar",
        title: "Itinerary",
        description: "Insert itinerary highlights",
        keyboardHint: "I",
      },
      {
        id: "rewrite",
        command: "/rewrite",
        icon: "pen-line",
        title: "Rewrite",
        description: "Adjust tone and clarity",
        keyboardHint: "R",
      },
      {
        id: "translate",
        command: "/translate",
        icon: "languages",
        title: "Translate",
        description: "Translate draft to another language",
        keyboardHint: "L",
      },
      {
        id: "note",
        command: "/note",
        icon: "notebook-pen",
        title: "Note",
        description: "Add an internal note",
        keyboardHint: "N",
      },
      {
        id: "tag",
        command: "/tag",
        icon: "tag",
        title: "Tag",
        description: "Add conversation tags",
        keyboardHint: "G",
      },
    ],
    templates: [
      {
        id: "greeting",
        title: "Greeting",
        preview: "Halo Kak, terima kasih sudah menghubungi kami.",
      },
      {
        id: "follow-up",
        title: "Follow Up",
        preview: "Halo Kak, saya ingin menindaklanjuti percakapan kita sebelumnya.",
      },
      {
        id: "quotation",
        title: "Quotation",
        preview: "Berikut quotation paket yang Kakak minta.",
      },
      {
        id: "payment-reminder",
        title: "Payment Reminder",
        preview: "Reminder pembayaran DP untuk booking Kakak.",
      },
      {
        id: "thank-you",
        title: "Thank You",
        preview: "Terima kasih atas kepercayaannya, Kak.",
      },
      {
        id: "closing",
        title: "Closing",
        preview: "Siap saya bantu proses booking-nya sekarang, Kak?",
      },
    ],
    rewriteOptions: [
      { id: "professional", label: "More Professional" },
      { id: "shorter", label: "Shorter" },
      { id: "friendlier", label: "Friendlier" },
      { id: "luxury", label: "Luxury Tone" },
      { id: "islamic", label: "Islamic Tone" },
      { id: "persuasive", label: "Persuasive" },
    ],
    translationOptions: [
      { id: "en", language: "English" },
      { id: "ar", language: "Arabic" },
      { id: "ms", language: "Malay" },
      { id: "zh", language: "Chinese" },
      { id: "ja", language: "Japanese" },
    ],
  };
}

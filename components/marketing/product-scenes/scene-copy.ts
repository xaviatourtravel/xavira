import type { SceneLocale } from "@/components/marketing/product-scenes/use-scene-locale";

const copy = {
  hero: {
    toolbar: { id: "app.desklabs.id / workspace", en: "app.desklabs.id / workspace" },
    callouts: {
      qualified: { id: "Lead qualified", en: "Lead qualified" },
      followUp: { id: "Follow-up scheduled", en: "Follow-up scheduled" },
      aurora: { id: "Aurora prepared a reply", en: "Aurora prepared a reply" },
    },
    queue: { id: "Percakapan", en: "Conversations" },
    context: { id: "Konteks pelanggan", en: "Customer context" },
    stage: { id: "Tahap", en: "Stage" },
    nextAction: { id: "Aksi berikutnya", en: "Next action" },
    operation: { id: "Operasi", en: "Operation" },
    messages: {
      inbound: {
        id: "Halo, saya ingin konsultasi paket growth. Bisa follow up hari ini?",
        en: "Hi, I'd like to discuss the growth plan. Can you follow up today?",
      },
      outbound: {
        id: "Terima kasih Nadia — tim kami siapkan proposal hari ini.",
        en: "Thanks Nadia — our team will prepare a proposal today.",
      },
    },
  },
  channels: {
    whatsapp: { id: "WhatsApp", en: "WhatsApp" },
    instagram: { id: "Instagram", en: "Instagram" },
    email: { id: "Email", en: "Email" },
  },
  aurora: {
    reviewDraft: { id: "Review draft", en: "Review draft" },
    editResponse: { id: "Edit response", en: "Edit response" },
    approveSend: { id: "Approve and send", en: "Approve and send" },
    suggestedStep: { id: "Suggested next step", en: "Suggested next step" },
    humanRequired: { id: "Human approval required", en: "Human approval required" },
  },
  comparison: {
    disconnected: { id: "Alat terpisah", en: "Disconnected tools" },
    desklabs: { id: "Desklabs workspace", en: "Desklabs workspace" },
  },
} as const;

export function t(locale: SceneLocale, entry: { id: string; en: string }) {
  return locale === "id" ? entry.id : entry.en;
}

export function sceneCopy(locale: SceneLocale) {
  return {
    hero: {
      toolbar: t(locale, copy.hero.toolbar),
      callouts: {
        qualified: t(locale, copy.hero.callouts.qualified),
        followUp: t(locale, copy.hero.callouts.followUp),
        aurora: t(locale, copy.hero.callouts.aurora),
      },
      queue: t(locale, copy.hero.queue),
      context: t(locale, copy.hero.context),
      stage: t(locale, copy.hero.stage),
      nextAction: t(locale, copy.hero.nextAction),
      operation: t(locale, copy.hero.operation),
      messages: {
        inbound: t(locale, copy.hero.messages.inbound),
        outbound: t(locale, copy.hero.messages.outbound),
      },
    },
    channels: {
      whatsapp: t(locale, copy.channels.whatsapp),
      instagram: t(locale, copy.channels.instagram),
      email: t(locale, copy.channels.email),
    },
    aurora: {
      reviewDraft: t(locale, copy.aurora.reviewDraft),
      editResponse: t(locale, copy.aurora.editResponse),
      approveSend: t(locale, copy.aurora.approveSend),
      suggestedStep: t(locale, copy.aurora.suggestedStep),
      humanRequired: t(locale, copy.aurora.humanRequired),
    },
    comparison: {
      disconnected: t(locale, copy.comparison.disconnected),
      desklabs: t(locale, copy.comparison.desklabs),
    },
  };
}

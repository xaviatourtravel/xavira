import { WhatsAppWebhookPageShell } from "@/components/settings/whatsapp-webhook-panel";

function getWhatsAppWebhookUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "http://localhost:3000";

  return `${siteUrl.replace(/\/$/, "")}/api/webhooks/whatsapp`;
}

export default function WhatsAppWebhookPage() {
  return <WhatsAppWebhookPageShell webhookUrl={getWhatsAppWebhookUrl()} />;
}

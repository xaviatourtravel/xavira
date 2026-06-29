"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

import { AccountCard } from "@/components/account/account-card";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { designSystemTypography } from "@/lib/design-system/tokens";

type WhatsAppWebhookPanelProps = {
  webhookUrl: string;
};

export function WhatsAppWebhookPanel({ webhookUrl }: WhatsAppWebhookPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <AccountCard
        title="Webhook URL"
        description="Daftarkan URL ini di pengaturan webhook WhatsApp agar pesan masuk otomatis ke Desklabs."
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="break-all font-mono text-sm text-slate-900">{webhookUrl}</p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Untuk pengembangan lokal, pastikan tunnel publik aktif jika webhook
            diakses dari luar perangkat ini.
          </p>
          <DesklabsButton
            type="button"
            variant="outline"
            onClick={() => void handleCopy()}
            className="h-11 w-full sm:w-auto"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Tersalin" : "Salin URL"}
          </DesklabsButton>
        </div>
      </AccountCard>

      <AccountCard title="Langkah Setup">
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600">
          <li>Pastikan WhatsApp sudah terhubung di halaman integrasi WhatsApp.</li>
          <li>Salin webhook URL di atas.</li>
          <li>Tempel URL ke konfigurasi webhook channel WhatsApp Anda.</li>
          <li>Kirim pesan uji dari nomor lain ke WhatsApp yang terhubung.</li>
          <li>Buka Inbox WhatsApp di Desklabs untuk melihat percakapan masuk.</li>
        </ol>
      </AccountCard>
    </div>
  );
}

export function WhatsAppWebhookPageShell({
  webhookUrl,
}: WhatsAppWebhookPanelProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
      <header className="space-y-3">
        <p className="text-sm text-slate-500">
          <Link
            href="/settings?section=integrations"
            className="font-medium text-slate-700 hover:text-slate-950 hover:underline"
          >
            Pengaturan
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <Link
            href="/settings?section=integrations"
            className="font-medium text-slate-700 hover:text-slate-950 hover:underline"
          >
            Integrasi
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <Link
            href="/settings/integrations/whatsapp"
            className="font-medium text-slate-700 hover:text-slate-950 hover:underline"
          >
            WhatsApp
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-950">Webhook</span>
        </p>
        <div className="space-y-2">
          <h1 className={designSystemTypography.h2}>WhatsApp Webhook</h1>
          <p className={designSystemTypography.body}>
            Atur endpoint webhook agar pesan masuk WhatsApp tersimpan otomatis
            di workspace Desklabs.
          </p>
        </div>
      </header>

      <WhatsAppWebhookPanel webhookUrl={webhookUrl} />
    </div>
  );
}

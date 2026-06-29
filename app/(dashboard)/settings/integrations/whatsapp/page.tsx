import Link from "next/link";

import { WhatsAppIntegrationPanel } from "@/components/settings/whatsapp-integration-panel";
import { designSystemTypography } from "@/lib/design-system/tokens";
import { canManageIntegrations } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";

export default async function WhatsAppIntegrationPage() {
  const { profile } = await requireProfile();
  const canManage = canManageIntegrations(profile);

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
          <span className="font-medium text-slate-950">WhatsApp</span>
        </p>
        <div className="space-y-2">
          <h1 className={designSystemTypography.h2}>WhatsApp</h1>
          <p className={designSystemTypography.body}>
            Hubungkan nomor WhatsApp agar percakapan customer dapat masuk ke
            Desklabs.
          </p>
        </div>
      </header>

      <WhatsAppIntegrationPanel canManage={canManage} />
    </div>
  );
}

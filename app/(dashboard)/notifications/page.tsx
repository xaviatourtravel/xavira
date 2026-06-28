import Link from "next/link";

import { AppWorkspaceFrame } from "@/components/layout/app-workspace-frame";
import { buildNotificationSummary } from "@/lib/navigation/build-notification-summary";
import { loadNavAttentionBadges } from "@/lib/navigation/load-attention-badges";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function NotificationsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const badges = await loadNavAttentionBadges(supabase, profile);
  const summary = buildNotificationSummary(badges);

  return (
    <AppWorkspaceFrame
      header={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Notifikasi
          </h1>
          <p className="text-sm text-slate-500">
            Ringkasan item yang perlu perhatian di workspace Anda.
          </p>
        </div>
      }
    >
      {summary.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">Tidak ada notifikasi baru.</p>
          <p className="mt-2 text-sm text-slate-500">
            Semua percakapan, task, dan pembayaran sudah tertangani.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {summary.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
              >
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-800">
                  {item.count}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppWorkspaceFrame>
  );
}

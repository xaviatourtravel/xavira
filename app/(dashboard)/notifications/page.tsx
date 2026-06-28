import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";

import { AppWorkspaceFrame } from "@/components/layout/app-workspace-frame";
import { buttonVariants } from "@/components/ui/button";
import { buildNotificationSummary } from "@/lib/navigation/build-notification-summary";
import { loadNavAttentionBadges } from "@/lib/navigation/load-attention-badges";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

function NotificationsEmptyState() {
  return (
    <div className="flex justify-center py-4 md:py-8">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-10">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="mt-5 text-base font-medium text-slate-900">
            Semua sudah tertangani
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Tidak ada reminder, pesan belum dibalas, atau pembayaran yang perlu
            perhatian saat ini.
          </p>
          <Link
            href="/today"
            className={cn(buttonVariants({ variant: "outline" }), "mt-8 h-10")}
          >
            Kembali ke Hari Ini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function NotificationsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const badges = await loadNavAttentionBadges(supabase, profile);
  const summary = buildNotificationSummary(badges);

  return (
    <AppWorkspaceFrame
      header={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Bell className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Notifikasi
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            Semua reminder, pesan belum dibalas, pembayaran, dan aktivitas penting
            akan muncul di sini.
          </p>
        </div>
      }
    >
      {summary.items.length === 0 ? (
        <NotificationsEmptyState />
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

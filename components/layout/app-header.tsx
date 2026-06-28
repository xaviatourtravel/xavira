"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Bot,
  ChevronDown,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";

import { signOut } from "@/actions/auth";
import { QuickCreateMenu } from "@/components/layout/quick-create-menu";
import { UniversalSearch } from "@/components/layout/universal-search";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { NavAttentionBadges } from "@/config/navigation";
import type { Profile } from "@/types/app-types";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  profile: Profile;
  attentionBadges: NavAttentionBadges;
  workspaceName?: string;
};

export function AppHeader({
  profile,
  attentionBadges,
  workspaceName = siteConfig.name,
}: AppHeaderProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const attentionTotal =
    attentionBadges.communication +
    attentionBadges.operational +
    attentionBadges.finance;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-white/95 px-3 backdrop-blur md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <UniversalSearch />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <QuickCreateMenu />

          <Link
            href="/today"
            className={cn(
              "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50",
              pathname.startsWith("/today") && "bg-slate-50",
            )}
            aria-label={`Notifikasi operasional${attentionTotal > 0 ? ` (${attentionTotal})` : ""}`}
            title="Attention items"
          >
            <Bell className="h-4 w-4" />
            {attentionTotal > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                {attentionTotal > 9 ? "9+" : attentionTotal}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100"
            aria-label="AI Assistant"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </button>

          <button
            type="button"
            className="hidden h-9 max-w-[140px] items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 hover:bg-slate-50 lg:inline-flex"
            title="Workspace switcher"
          >
            <span className="truncate">{workspaceName}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 pl-1.5 pr-2.5 hover:bg-slate-50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[10px] font-semibold text-white">
                {(profile.full_name ?? "U").charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-800 sm:inline">
                {profile.full_name ?? "User"}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>

            {profileOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {profile.full_name ?? "User"}
                    </p>
                    <p className="text-xs capitalize text-slate-500">{profile.role}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4" />
                      Pengaturan
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {aiOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-end bg-black/30 p-4 sm:items-start sm:justify-end sm:pt-20">
          <button
            type="button"
            aria-label="Close AI assistant"
            className="absolute inset-0"
            onClick={() => setAiOpen(false)}
          />
          <aside className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/80 px-4 py-3">
              <Bot className="h-5 w-5 text-violet-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
                <p className="text-xs text-slate-500">Contextual layer — bukan menu navigasi</p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm leading-relaxed text-slate-600">
                AI Assistant hadir di setiap workspace sebagai lapisan kontekstual.
                Gunakan panel ini untuk ringkasan, saran tindakan, dan insight — tanpa
                meninggalkan alur kerja Anda.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setAiOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

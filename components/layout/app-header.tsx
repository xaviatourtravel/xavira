"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";

import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { QuickCreateMenu } from "@/components/layout/quick-create-menu";
import { UniversalSearch } from "@/components/layout/universal-search";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Button } from "@/components/ui/button";
import type { NavAttentionBadges } from "@/config/navigation";
import type { Profile } from "@/types/app-types";
import type { WorkspaceSwitcherContext } from "@/lib/workspace/types";

type AppHeaderProps = {
  profile: Profile;
  email?: string | null;
  attentionBadges: NavAttentionBadges;
  workspaceContext: WorkspaceSwitcherContext;
};

export function AppHeader({
  profile,
  email,
  attentionBadges,
  workspaceContext,
}: AppHeaderProps) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-white/95 px-3 backdrop-blur md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <UniversalSearch />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <QuickCreateMenu />

          <NotificationDropdown attentionBadges={attentionBadges} />

          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100"
            aria-label="Asisten AI"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </button>

          <WorkspaceSwitcher context={workspaceContext} />

          <ProfileMenu profile={profile} email={email} />
        </div>
      </header>

      {aiOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-end bg-black/30 p-4 sm:items-start sm:justify-end sm:pt-20">
          <button
            type="button"
            aria-label="Tutup asisten AI"
            className="absolute inset-0"
            onClick={() => setAiOpen(false)}
          />
          <aside className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/80 px-4 py-3">
              <Bot className="h-5 w-5 text-violet-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Asisten AI</p>
                <p className="text-xs text-slate-500">
                  Layer kontekstual, bukan menu navigasi
                </p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm leading-relaxed text-slate-600">
                Asisten AI hadir di setiap workspace sebagai lapisan kontekstual.
                Gunakan panel ini untuk ringkasan, saran tindakan, dan insight tanpa
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

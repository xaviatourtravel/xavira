"use client";

import { useState } from "react";
import { Bot, Menu, Sparkles } from "lucide-react";

import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { QuickCreateMenu } from "@/components/layout/quick-create-menu";
import {
  UniversalSearchBar,
  UniversalSearchIconButton,
  UniversalSearchScope,
} from "@/components/layout/universal-search";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { ThemeToggleIconButton } from "@/components/theme/theme-toggle";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { Button } from "@/components/ui/button";
import type { NavAttentionBadges } from "@/config/navigation";
import type { Profile } from "@/types/app-types";
import type { WorkspaceSwitcherContext } from "@/lib/workspace/types";

type AppHeaderProps = {
  profile: Profile;
  email?: string | null;
  attentionBadges: NavAttentionBadges;
  workspaceContext: WorkspaceSwitcherContext;
  onMenuClick?: () => void;
};

export function AppHeader({
  profile,
  email,
  attentionBadges,
  workspaceContext,
  onMenuClick,
}: AppHeaderProps) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <UniversalSearchScope>
      <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-background px-3 lg:px-4">
        <div className="flex h-14 w-full items-center gap-2 lg:gap-3">
          <button
            type="button"
            aria-label="Buka menu navigasi"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/60 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 overflow-hidden lg:hidden">
            <WorkspaceSwitcher context={workspaceContext} variant="mobile" />
          </div>

          <div className="hidden min-w-0 flex-1 items-center lg:flex">
            <UniversalSearchBar />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
            <UniversalSearchIconButton className="lg:hidden" />

            <div className="hidden lg:block">
              <QuickCreateMenu />
            </div>

            <NotificationDropdown attentionBadges={attentionBadges} />

            <ThemeToggleIconButton className="hidden lg:inline-flex" />

            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="hidden h-11 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/40 lg:inline-flex"
              aria-label="Asisten AI"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI</span>
            </button>

            <div className="hidden lg:block">
              <WorkspaceSwitcher context={workspaceContext} variant="desktop" />
            </div>

            <ProfileMenu profile={profile} email={email} />
          </div>
        </div>
      </header>

      <MobileSheet
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="Asisten AI"
        subtitle="Layer kontekstual, bukan menu navigasi"
        footer={
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={() => setAiOpen(false)}
          >
            Tutup
          </Button>
        }
      >
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Bot className="h-5 w-5" />
            <p className="text-sm font-medium text-foreground">Asisten kontekstual</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Asisten AI hadir di setiap workspace sebagai lapisan kontekstual. Gunakan panel
            ini untuk ringkasan, saran tindakan, dan insight tanpa meninggalkan alur kerja Anda.
          </p>
        </div>
      </MobileSheet>

      {aiOpen ? (
        <div className="fixed inset-0 z-[70] hidden items-start justify-end bg-black/30 p-4 lg:flex lg:pt-20">
          <button
            type="button"
            aria-label="Tutup asisten AI"
            className="absolute inset-0"
            onClick={() => setAiOpen(false)}
          />
          <aside className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-violet-200 bg-card shadow-2xl dark:border-violet-900/60">
            <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-900/50 dark:bg-violet-950/30">
              <Bot className="h-5 w-5 text-violet-700 dark:text-violet-300" />
              <div>
                <p className="text-sm font-semibold text-foreground">Asisten AI</p>
                <p className="text-xs text-muted-foreground">
                  Layer kontekstual, bukan menu navigasi
                </p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Asisten AI hadir di setiap workspace sebagai lapisan kontekstual.
                Gunakan panel ini untuk ringkasan, saran tindakan, dan insight tanpa
                meninggalkan alur kerja Anda.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={() => setAiOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </UniversalSearchScope>
  );
}

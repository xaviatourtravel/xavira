"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import type { NavAttentionBadges } from "@/config/navigation";
import type { Permission } from "@/lib/auth/permission-matrix";
import { cn } from "@/lib/utils";

type MobileSidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  permissions: Permission[];
  attentionBadges?: NavAttentionBadges;
};

export function MobileSidebarDrawer({
  open,
  onClose,
  permissions,
  attentionBadges,
}: MobileSidebarDrawerProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Tutup menu"
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-[100dvh] w-[min(82vw,320px)] flex-col",
          "border-r border-border bg-card text-card-foreground shadow-[4px_0_24px_rgba(15,23,42,0.12)] lg:hidden",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <p className="text-sm font-semibold text-foreground">Menu</p>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
          <SidebarNavigation
            permissions={permissions}
            attentionBadges={attentionBadges}
            onNavigate={onClose}
            showBrand={false}
          />
        </div>
      </aside>
    </>,
    document.body,
  );
}

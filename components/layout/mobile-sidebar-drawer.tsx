"use client";

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

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Tutup menu"
        className="fixed inset-0 z-[90] bg-black/40 md:hidden"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={cn(
          "fixed inset-y-0 left-0 z-[91] flex w-[min(100%,17.5rem)] flex-col border-r border-slate-200/80 bg-slate-50/40 shadow-2xl md:hidden",
          "animate-in slide-in-from-left duration-200",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 px-4">
          <p className="text-sm font-semibold text-slate-950">Menu</p>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNavigation
          permissions={permissions}
          attentionBadges={attentionBadges}
          onNavigate={onClose}
          showBrand={false}
        />
      </aside>
    </>,
    document.body,
  );
}

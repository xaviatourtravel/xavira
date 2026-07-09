"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { NavAttentionBadges } from "@/config/navigation";
import { buildNotificationSummary } from "@/lib/navigation/build-notification-summary";
import { cn } from "@/lib/utils";

type NotificationDropdownProps = {
  attentionBadges: NavAttentionBadges;
};

function NotificationPanel({
  summary,
  onClose,
}: {
  summary: ReturnType<typeof buildNotificationSummary>;
  onClose: () => void;
}) {
  return (
    <>
      {summary.items.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          Tidak ada notifikasi baru.
        </div>
      ) : (
        <ul className="p-1.5">
          {summary.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex min-h-[44px] items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
              >
                <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                  {item.count}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border p-2">
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex min-h-[44px] items-center justify-center rounded-lg px-3 text-sm font-medium text-foreground/80 hover:bg-muted/60"
        >
          Lihat semua notifikasi
        </Link>
      </div>
    </>
  );
}

export function NotificationDropdown({ attentionBadges }: NotificationDropdownProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const summary = buildNotificationSummary(attentionBadges);

  useEffect(() => {
    if (!open || isMobile) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isMobile, open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/20",
          open && "bg-muted/20",
        )}
        aria-label={
          summary.totalCount > 0
            ? `Notifikasi (${summary.totalCount})`
            : "Notifikasi"
        }
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {summary.totalCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/90 px-0.5 text-[10px] font-semibold leading-none text-white">
            {summary.totalCount > 9 ? "9+" : summary.totalCount}
          </span>
        ) : null}
      </button>

      {open && isMobile ? (
        <MobileSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Notifikasi"
          ariaLabel="Notifikasi"
        >
          <NotificationPanel summary={summary} onClose={() => setOpen(false)} />
        </MobileSheet>
      ) : null}

      {open && !isMobile ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifikasi</p>
          </div>
          <NotificationPanel summary={summary} onClose={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import type { NavAttentionBadges } from "@/config/navigation";
import { buildNotificationSummary } from "@/lib/navigation/build-notification-summary";
import { cn } from "@/lib/utils";

type NotificationDropdownProps = {
  attentionBadges: NavAttentionBadges;
};

export function NotificationDropdown({ attentionBadges }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const summary = buildNotificationSummary(attentionBadges);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50",
          open && "bg-slate-50",
        )}
        aria-label={
          summary.totalCount > 0
            ? `Notifikasi (${summary.totalCount})`
            : "Notifikasi"
        }
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {summary.totalCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
            {summary.totalCount > 9 ? "9+" : summary.totalCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-950">Notifikasi</p>
          </div>

          {summary.items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Tidak ada notifikasi baru.
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto p-1.5">
              {summary.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold text-amber-800">
                      {item.count}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-slate-100 p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

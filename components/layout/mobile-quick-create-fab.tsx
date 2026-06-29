"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { MobileSheet } from "@/components/ui/mobile-sheet";
import { QUICK_CREATE_ITEMS } from "@/lib/navigation/quick-create-items";
import { cn } from "@/lib/utils";

export function MobileQuickCreateFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Buat cepat"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-transform hover:bg-emerald-800 active:scale-95 md:hidden"
      >
        <Plus className="h-5 w-5" />
      </button>

      <MobileSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Cepat"
        subtitle="Aksi global untuk memulai pekerjaan baru."
      >
        <ul className="p-2">
          {QUICK_CREATE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isComingSoon = item.status === "coming_soon";

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isComingSoon
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {item.label}
                      </span>
                      {isComingSoon ? (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          Segera
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </MobileSheet>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  FileText,
  Plus,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_CREATE_ITEMS = [
  {
    label: "Lead baru",
    href: "/leads/new",
    icon: UserPlus,
    description: "Tambah calon customer",
  },
  {
    label: "Booking baru",
    href: "/bookings/new",
    icon: CalendarPlus,
    description: "Buat booking customer",
  },
  {
    label: "Package baru",
    href: "/packages/new",
    icon: FileText,
    description: "Tambah paket produk",
  },
] as const;

export function QuickCreateMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
      <Button
        type="button"
        size="sm"
        className="h-9 gap-1.5 bg-emerald-700 px-3 hover:bg-emerald-800"
        onClick={() => setOpen((value) => !value)}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Buat</span>
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buat Cepat
            </p>
          </div>
          <ul className="p-1.5">
            {QUICK_CREATE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50",
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">
                        {item.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { Bell, CheckCheck, MessageCircle, Wallet } from "lucide-react";
import { useState } from "react";

import { DsBadge } from "@/components/design-system/badge";
import { cn } from "@/lib/utils";
import { designSystemPanelClass } from "@/lib/design-system/tokens";

const notifications = [
  {
    id: "1",
    title: "Pembayaran masuk",
    detail: "Customer Ani melunasi tagihan INV-104",
    time: "5 menit lalu",
    icon: Wallet,
    unread: true,
  },
  {
    id: "2",
    title: "Chat belum dibalas",
    detail: "3 percakapan menunggu balasan tim sales",
    time: "22 menit lalu",
    icon: MessageCircle,
    unread: true,
  },
  {
    id: "3",
    title: "Tugas selesai",
    detail: "Follow up keberangkatan Maret sudah ditandai selesai",
    time: "1 jam lalu",
    icon: CheckCheck,
    unread: false,
  },
];

export function DsNotificationMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      </button>

      {open ? (
        <div
          className={cn(
            designSystemPanelClass,
            "absolute right-0 z-20 mt-2 w-80 overflow-hidden",
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-950">Notifikasi</p>
            <DsBadge variant="perlu-tindakan">2 baru</DsBadge>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {notifications.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0",
                    item.unread ? "bg-slate-50/80" : "bg-white",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      {item.detail}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-slate-100 px-4 py-2">
            <button
              type="button"
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Tandai semua sudah dibaca
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

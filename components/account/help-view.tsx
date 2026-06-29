"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { designSystemPanelClass } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    id: "create-customer",
    question: "Bagaimana cara membuat customer?",
    answer:
      "Buka menu Customer, klik Buat Cepat atau tombol tambah customer. Isi nama, kontak, dan minat paket. Customer baru akan muncul di daftar dan siap untuk ditindaklanjuti.",
  },
  {
    id: "create-booking",
    question: "Bagaimana cara membuat booking?",
    answer:
      "Dari workspace customer, buat booking setelah customer siap lanjut. Anda juga bisa membuka menu Booking dan memilih customer yang sudah ada.",
  },
  {
    id: "record-payment",
    question: "Bagaimana cara mencatat pembayaran?",
    answer:
      "Buka detail booking customer, lalu tambah pembayaran di bagian Pembayaran. Catat jumlah, metode, dan tanggal untuk melacak sisa tagihan.",
  },
  {
    id: "invite-team",
    question: "Bagaimana cara mengundang anggota tim?",
    answer:
      "Buka Pengaturan Workspace, masuk ke Anggota Tim, lalu buat undangan dengan email dan role. Bagikan link undangan kepada anggota baru.",
  },
  {
    id: "connect-channel",
    question: "Bagaimana cara menghubungkan WhatsApp atau Instagram?",
    answer:
      "Buka Pengaturan, pilih Integrasi, lalu hubungkan channel yang tersedia. Ikuti langkah otorisasi hingga status koneksi aktif.",
  },
] as const;

export function HelpView() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item) => {
        const isOpen = openId === item.id;

        return (
          <section
            key={item.id}
            className={cn(designSystemPanelClass, "overflow-hidden")}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
            >
              <span className="text-sm font-semibold text-slate-950">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen ? (
              <div className="border-t border-slate-100 px-5 pb-5 sm:px-6">
                <p className="pt-4 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

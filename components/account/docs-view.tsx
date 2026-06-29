"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { designSystemPanelClass } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";

const DOC_SECTIONS = [
  {
    id: "getting-started",
    title: "Memulai dengan Desklabs",
    content:
      "Desklabs membantu tim sales dan operasional mengelola customer, komunikasi, booking, dan keuangan dalam satu workspace. Mulai dari Ruang Kerja Hari Ini untuk melihat prioritas harian.",
  },
  {
    id: "workspace",
    title: "Workspace",
    content:
      "Workspace adalah ruang kerja tim Anda. Atur profil organisasi, anggota tim, dan preferensi operasional dari menu Pengaturan.",
  },
  {
    id: "customer",
    title: "Customer",
    content:
      "Customer adalah pusat alur penjualan. Setiap customer memiliki workspace sendiri dengan ringkasan AI, percakapan, booking, pembayaran, dan tugas tindak lanjut.",
  },
  {
    id: "communication",
    title: "Komunikasi",
    content:
      "Inbox Desklabs mengumpulkan percakapan dari channel yang terhubung. Balas customer, lihat konteks lead, dan lanjutkan pekerjaan tanpa pindah tab.",
  },
  {
    id: "operations",
    title: "Operasional",
    content:
      "Kelola follow up, tugas, dan aktivitas harian dari workspace Operasional dan Ruang Kerja Hari Ini.",
  },
  {
    id: "finance",
    title: "Keuangan",
    content:
      "Pantau pembayaran, tagihan, dan outstanding dari modul Keuangan. Data terhubung dengan booking customer.",
  },
  {
    id: "performance",
    title: "Performa",
    content:
      "Lihat metrik penjualan, pipeline, dan performa tim untuk mengambil keputusan berbasis data.",
  },
  {
    id: "integrations",
    title: "Integrasi",
    content:
      "Hubungkan WhatsApp, Instagram, dan channel lain agar percakapan masuk ke Inbox secara otomatis.",
  },
  {
    id: "ai-knowledge",
    title: "AI dan Knowledge Layer",
    content:
      "AI Desklabs memberi ringkasan customer, rekomendasi tindakan, dan insight kontekstual. Knowledge Layer menyimpan materi referensi tim.",
  },
] as const;

export function DocsView() {
  const [openId, setOpenId] = useState<string | null>(DOC_SECTIONS[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {DOC_SECTIONS.map((section) => {
        const isOpen = openId === section.id;

        return (
          <section
            key={section.id}
            className={cn(designSystemPanelClass, "overflow-hidden")}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : section.id)}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
            >
              <span className="text-sm font-semibold text-slate-950">{section.title}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen ? (
              <div className="border-t border-slate-100 px-5 pb-5 sm:px-6">
                <p className="pt-4 text-sm leading-relaxed text-slate-600">{section.content}</p>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

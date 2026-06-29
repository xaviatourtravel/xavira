"use client";

import {
  CalendarClock,
  FolderOpen,
  MessageCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import {
  DsAiInsight,
  DsAiRecommendation,
  DsAiSummary,
  DsAvatar,
  DsAvatarGroup,
  DsBadge,
  DsBody,
  DsCaption,
  DsCard,
  DsCardPlaceholder,
  DsCheckbox,
  DsColorSwatch,
  DsDisplay,
  DsEmptyState,
  DsField,
  DsH1,
  DsH2,
  DsH3,
  DsNotificationMenu,
  DsPasswordInput,
  DsRadioGroup,
  DsSearchInput,
  DsSection,
  DsSelect,
  DsShowcaseGrid,
  DsShowcaseRow,
  DsSkeletonList,
  DsSpinner,
  DsTextarea,
  DsTextInput,
  DsTimeline,
  DsToast,
  DsToastStack,
  DsToggle,
  DsButton,
} from "@/components/design-system";
import { designSystemColors } from "@/lib/design-system/tokens";

const NAV_SECTIONS = [
  { id: "colors", label: "Warna" },
  { id: "typography", label: "Tipografi" },
  { id: "buttons", label: "Tombol" },
  { id: "inputs", label: "Input" },
  { id: "cards", label: "Kartu" },
  { id: "badges", label: "Badge" },
  { id: "empty-states", label: "Empty State" },
  { id: "timeline", label: "Linimasa" },
  { id: "ai", label: "Komponen AI" },
  { id: "notification", label: "Notifikasi" },
  { id: "toast", label: "Toast" },
  { id: "avatar", label: "Avatar" },
  { id: "loading", label: "Loading" },
];

const TIMELINE_ITEMS = [
  {
    id: "1",
    title: "Pesan masuk WhatsApp",
    description: "Customer minta update itinerary Maret",
    occurredAt: "17 Jun, 09.12",
    category: "WhatsApp",
    tone: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "2",
    title: "Catatan internal ditambahkan",
    description: "Preferensi kamar twin dicatat tim ops",
    occurredAt: "17 Jun, 08.40",
    category: "Catatan",
    tone: "bg-zinc-100 text-zinc-700",
  },
  {
    id: "3",
    title: "Tagihan booking dibuat",
    description: "INV-104 · Rp 28.500.000",
    occurredAt: "16 Jun, 16.05",
    category: "Tagihan",
    tone: "bg-amber-100 text-amber-800",
  },
];

export function DesignSystemShowcase() {
  const [radioValue, setRadioValue] = useState("whatsapp");
  const [toggleValue, setToggleValue] = useState(true);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 lg:flex-row lg:gap-12 lg:px-8 lg:py-10">
      <aside className="lg:sticky lg:top-6 lg:w-56 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
          Desklabs
        </p>
        <DsH2 className="mt-1 text-lg">Design System</DsH2>
        <DsCaption className="mt-2">
          Referensi internal untuk pengembangan UI. Tidak ditampilkan di navigasi produk.
        </DsCaption>
        <nav className="mt-6 space-y-1">
          {NAV_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-14">
        <header className="space-y-3 border-b border-slate-200 pb-8">
          <DsDisplay>Design System Desklabs</DsDisplay>
          <DsBody>
            Halaman ini menjadi sumber kebenaran tunggal untuk komponen UI. Gunakan komponen
            dari <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">@/components/design-system</code>{" "}
            di semua halaman baru.
          </DsBody>
        </header>

        <DsSection
          id="colors"
          title="Warna"
          description="Token warna semantik untuk seluruh produk."
        >
          <DsShowcaseGrid columns={3}>
            {designSystemColors.map((color) => (
              <DsColorSwatch
                key={color.id}
                label={color.label}
                description={color.description}
                hex={color.hex}
                swatchClass={color.swatchClass}
                textClass={color.textClass}
              />
            ))}
          </DsShowcaseGrid>
        </DsSection>

        <DsSection
          id="typography"
          title="Tipografi"
          description="Skala teks standar untuk hierarki konten."
        >
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <DsDisplay>Display · Ruang Kerja Customer</DsDisplay>
            <DsH1>H1 · Design System Desklabs</DsH1>
            <DsH2>H2 · Ringkasan AI</DsH2>
            <DsH3>H3 · Status booking</DsH3>
            <DsBody>
              Body · Semua aktivitas customer dalam satu urutan kronologis untuk membantu
              tim sales bekerja tanpa pindah halaman.
            </DsBody>
            <DsCaption>Caption · Diperbarui otomatis saat data percakapan bertambah</DsCaption>
          </div>
        </DsSection>

        <DsSection id="buttons" title="Tombol" description="Varian aksi utama produk.">
          <DsShowcaseRow>
            <DsButton>Primary</DsButton>
            <DsButton variant="outline">Secondary</DsButton>
            <DsButton variant="ghost">Ghost</DsButton>
            <DsButton variant="destructive">Danger</DsButton>
            <DsButton disabled>Disabled</DsButton>
            <DsButton loading loadingLabel="Memproses...">
              Simpan
            </DsButton>
          </DsShowcaseRow>
        </DsSection>

        <DsSection id="inputs" title="Input" description="Kontrol formulir standar.">
          <DsShowcaseGrid columns={2}>
            <DsField label="Teks" hint="Input teks satu baris">
              <DsTextInput placeholder="Nama customer" />
            </DsField>
            <DsField label="Pencarian">
              <DsSearchInput />
            </DsField>
            <DsField label="Kata sandi">
              <DsPasswordInput />
            </DsField>
            <DsField label="Pilih paket">
              <DsSelect defaultValue="">
                <option value="" disabled>
                  Pilih paket
                </option>
                <option value="yunnan">Yunnan Premium 8D7N</option>
                <option value="japan">Japan Sakura 7D6N</option>
              </DsSelect>
            </DsField>
            <div className="md:col-span-2">
              <DsField label="Catatan">
                <DsTextarea placeholder="Tulis catatan internal untuk tim..." />
              </DsField>
            </div>
            <DsCheckbox label="Kirim pengingat otomatis" defaultChecked />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Channel utama</p>
              <DsRadioGroup
                name="channel"
                value={radioValue}
                onChange={setRadioValue}
                options={[
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "email", label: "Email" },
                  { value: "instagram", label: "Instagram" },
                ]}
              />
            </div>
            <DsToggle
              label="Notifikasi real-time"
              checked={toggleValue}
              onChange={setToggleValue}
            />
          </DsShowcaseGrid>
        </DsSection>

        <DsSection id="cards" title="Kartu" description="Tiga ukuran padding standar.">
          <DsShowcaseGrid columns={3}>
            <DsCard size="sm" title="Kartu Kecil" description="Ringkasan singkat">
              <DsBody>Konten padat untuk metrik atau status cepat.</DsBody>
            </DsCard>
            <DsCard size="md" title="Kartu Sedang" description="Section workspace">
              <DsBody>Default untuk section di ruang kerja customer dan dashboard.</DsBody>
            </DsCard>
            <DsCard size="lg" title="Kartu Besar" description="Hero atau onboarding">
              <DsBody>Ruang lebih luas untuk form multi-field atau highlight penting.</DsBody>
            </DsCard>
          </DsShowcaseGrid>
        </DsSection>

        <DsSection id="badges" title="Badge" description="Status operasional customer.">
          <DsShowcaseRow>
            <DsBadge variant="aktif">Aktif</DsBadge>
            <DsBadge variant="menunggu">Menunggu</DsBadge>
            <DsBadge variant="diproses">Diproses</DsBadge>
            <DsBadge variant="perlu-tindakan">Perlu Tindakan</DsBadge>
            <DsBadge variant="bermasalah">Bermasalah</DsBadge>
          </DsShowcaseRow>
        </DsSection>

        <DsSection
          id="empty-states"
          title="Empty State"
          description="Pola empty state yang dapat dipakai ulang."
        >
          <DsShowcaseGrid columns={2}>
            <DsEmptyState
              title="Belum ada booking"
              description="Booking customer akan muncul di sini setelah dibuat dari workspace."
              action={
                <DsButton size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Booking
                </DsButton>
              }
            />
            <DsEmptyState
              title="Belum ada aktivitas"
              description="Aktivitas customer akan muncul di sini."
              icon={CalendarClock}
            />
            <DsEmptyState
              title="Belum ada percakapan"
              description="Hubungi customer untuk memulai komunikasi."
              icon={MessageCircle}
            />
            <DsEmptyState
              title="Belum ada dokumen"
              description="Upload paspor dan dokumen pendukung setelah booking dibuat."
              icon={FolderOpen}
            />
          </DsShowcaseGrid>
        </DsSection>

        <DsSection
          id="timeline"
          title="Linimasa Bisnis"
          description="Contoh feed kronologis aktivitas customer."
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <DsTimeline items={TIMELINE_ITEMS} />
          </div>
        </DsSection>

        <DsSection
          id="ai"
          title="Komponen AI"
          description="Pola UI untuk ringkasan, rekomendasi, dan insight."
        >
          <DsShowcaseGrid columns={2}>
            <DsAiSummary
              items={[
                { label: "Minat customer", value: "Tertarik paket Yunnan Premium 8D7N" },
                { label: "Diskusi terakhir", value: "Customer minta opsi keberangkatan Maret" },
                { label: "Status follow up", value: "Tugas hubungi ulang dijadwalkan besok" },
                { label: "Status booking", value: "Belum ada booking" },
                { label: "Status pembayaran", value: "Belum ada pembayaran tercatat" },
              ]}
              disclaimer="Ringkasan ini akan diperbarui otomatis saat data percakapan bertambah."
            />
            <div className="space-y-4">
              <DsAiRecommendation
                title="Hubungi customer sebelum jam 15.00"
                detail="Kirim rekap paket dan opsi tanggal keberangkatan terdekat untuk mempercepat keputusan."
                priority="tinggi"
                action={
                  <DsButton size="sm" variant="outline">
                    Buat Tugas Follow Up
                  </DsButton>
                }
              />
              <DsShowcaseGrid columns={2}>
                <DsAiInsight label="Skor closing" value="78" trend="naik" />
                <DsAiInsight label="Respon rata-rata" value="12 mnt" trend="turun" />
              </DsShowcaseGrid>
            </div>
          </DsShowcaseGrid>
        </DsSection>

        <DsSection
          id="notification"
          title="Notifikasi"
          description="Dropdown notifikasi dengan badge unread."
        >
          <DsNotificationMenu />
        </DsSection>

        <DsSection id="toast" title="Toast" description="Feedback aksi singkat.">
          <DsToastStack>
            <DsToast
              variant="success"
              title="Booking berhasil dibuat"
              description="Customer sudah memiliki booking BK-20260617-A1B2."
            />
            <DsToast
              variant="error"
              title="Gagal menyimpan catatan"
              description="Periksa koneksi lalu coba lagi."
            />
            <DsToast
              variant="info"
              title="Integrasi channel sedang diproses"
              description="Balasan langsung akan aktif setelah koneksi selesai."
            />
          </DsToastStack>
        </DsSection>

        <DsSection id="avatar" title="Avatar" description="Inisial, foto, dan grup.">
          <DsShowcaseRow>
            <DsAvatar name="Pak Anang" />
            <DsAvatar name="Siti Rahma" size="lg" />
            <DsAvatar
              name="Budi Santoso"
              imageUrl="https://api.dicebear.com/9.x/initials/svg?seed=Budi"
            />
            <DsAvatarGroup
              items={[
                { name: "Pak Anang" },
                { name: "Siti Rahma" },
                { name: "Budi Santoso" },
                { name: "Dewi Lestari" },
                { name: "Rina" },
              ]}
            />
          </DsShowcaseRow>
        </DsSection>

        <DsSection id="loading" title="Loading" description="Skeleton, spinner, dan placeholder kartu.">
          <DsShowcaseGrid columns={3}>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <DsSpinner />
              <DsCaption>Spinner</DsCaption>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <DsCaption className="mb-4 block">Skeleton list</DsCaption>
              <DsSkeletonList rows={3} />
            </div>
            <DsCardPlaceholder />
          </DsShowcaseGrid>
        </DsSection>

        <footer className="border-t border-slate-200 pt-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span>
              Import komponen produksi dari{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                @/components/ui/desklabs-avatar
              </code>{" "}
              dan{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                @/components/ui/desklabs-loading
              </code>
              , atau alias design system dari{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                @/components/design-system
              </code>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

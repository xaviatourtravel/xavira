import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarPlus,
  CreditCard,
  HelpCircle,
  LifeBuoy,
  ListTodo,
  Settings,
  Shield,
  SlidersHorizontal,
  TrendingUp,
  User,
  Wallet,
  Wrench,
} from "lucide-react";

import type { ComingSoonRelatedLink } from "@/components/layout/coming-soon-workspace";

export type ComingSoonPreset = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  statusLabel?: string;
  description?: string;
  estimatedAvailability?: string;
  relatedLinks?: ComingSoonRelatedLink[];
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
};

export const DEFAULT_COMING_SOON: ComingSoonPreset = {
  title: "Fitur ini sedang disiapkan",
  subtitle:
    "Kami sedang merancang pengalaman yang lebih rapi dan terhubung untuk workspace ini.",
  icon: Wrench,
  statusLabel: "Segera hadir",
  primaryActionLabel: "Kembali ke Hari Ini",
  primaryActionHref: "/today",
  secondaryActionLabel: "Hubungi Support",
  secondaryActionHref: "/support",
};

export const COMING_SOON_PRESETS = {
  operations: {
    title: "Operasional",
    subtitle:
      "Kelola task, follow up, jadwal, dan pekerjaan harian tim dalam satu workspace.",
    icon: ListTodo,
    relatedLinks: [
      { label: "Hari Ini", href: "/today" },
      { label: "Follow Up", href: "/follow-ups" },
      { label: "Antrian Follow Up", href: "/follow-ups/queue" },
    ],
  },
  finance: {
    title: "Keuangan",
    subtitle:
      "Pantau pembayaran, invoice, outstanding, dan arus kas customer dengan lebih rapi.",
    icon: Wallet,
    relatedLinks: [
      { label: "Pendapatan", href: "/revenue" },
      { label: "Booking", href: "/bookings" },
    ],
  },
  performance: {
    title: "Performa",
    subtitle:
      "Lihat performa bisnis, campaign, konten, dan insight operasional dalam satu tempat.",
    icon: TrendingUp,
    relatedLinks: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Campaign", href: "/campaigns" },
      { label: "Konten", href: "/content" },
    ],
  },
  notifications: {
    title: "Notifikasi",
    subtitle:
      "Semua reminder, pesan belum dibalas, pembayaran, dan aktivitas penting akan muncul di sini.",
    icon: Bell,
  },
  profile: {
    title: "Profil Saya",
    subtitle: "Kelola informasi pribadi dan preferensi akun Anda.",
    icon: User,
    relatedLinks: [
      { label: "Preferensi", href: "/preferences" },
      { label: "Keamanan", href: "/security" },
    ],
  },
  preferences: {
    title: "Preferensi",
    subtitle: "Atur bahasa, tampilan, zona waktu, dan pengalaman kerja Anda di Desklabs.",
    icon: SlidersHorizontal,
    relatedLinks: [
      { label: "Profil Saya", href: "/profile" },
      { label: "Keamanan", href: "/security" },
    ],
  },
  security: {
    title: "Keamanan",
    subtitle: "Kelola password, sesi login, dan keamanan akun Anda.",
    icon: Shield,
    relatedLinks: [
      { label: "Profil Saya", href: "/profile" },
      { label: "Preferensi", href: "/preferences" },
    ],
  },
  workspaceSettings: {
    title: "Pengaturan Workspace",
    subtitle:
      "Atur informasi workspace, logo, warna brand, modul, dan preferensi bisnis.",
    icon: Settings,
    relatedLinks: [
      { label: "Pengaturan", href: "/settings" },
      { label: "Anggota Tim", href: "/settings/team" },
    ],
  },
  members: {
    title: "Anggota Tim",
    subtitle: "Undang anggota, atur role, dan kelola akses tim Anda.",
    icon: Building2,
    relatedLinks: [
      { label: "Pengaturan", href: "/settings" },
      { label: "Pengaturan Workspace", href: "/settings/organization" },
    ],
  },
  billing: {
    title: "Billing",
    subtitle: "Kelola paket berlangganan, invoice, dan metode pembayaran workspace.",
    icon: CreditCard,
    relatedLinks: [{ label: "Pengaturan", href: "/settings" }],
  },
  help: {
    title: "Bantuan",
    subtitle: "Temukan panduan penggunaan dan jawaban untuk pertanyaan umum.",
    icon: HelpCircle,
    relatedLinks: [
      { label: "Dokumentasi", href: "/docs" },
      { label: "Hubungi Support", href: "/support" },
    ],
  },
  docs: {
    title: "Dokumentasi",
    subtitle: "Pelajari cara kerja platform, integrasi, dan workflow Desklabs.",
    icon: BookOpen,
    relatedLinks: [
      { label: "Bantuan", href: "/help" },
      { label: "Hubungi Support", href: "/support" },
    ],
  },
  support: {
    title: "Hubungi Support",
    subtitle: "Kirim pertanyaan kepada tim Desklabs dan kami akan membantu Anda.",
    icon: LifeBuoy,
    description: "Email: support@desklabs.id",
    secondaryActionLabel: "Kirim Email",
    secondaryActionHref: "mailto:support@desklabs.id",
    relatedLinks: [
      { label: "Bantuan", href: "/help" },
      { label: "Dokumentasi", href: "/docs" },
    ],
  },
  newTask: {
    title: "Task Baru",
    subtitle:
      "Buat task operasional untuk tim Anda dan hubungkan langsung ke antrian Hari Ini.",
    icon: ListTodo,
    primaryActionLabel: "Kembali ke Operasional",
    primaryActionHref: "/operations",
  },
  newBooking: {
    title: "Booking Baru",
    subtitle:
      "Buat booking customer yang terhubung ke profil pelanggan dan alur pembayaran.",
    icon: CalendarPlus,
    primaryActionLabel: "Kembali ke Booking",
    primaryActionHref: "/bookings",
  },
  newWorkspace: {
    title: "Workspace Baru",
    subtitle:
      "Buat workspace baru untuk brand, unit bisnis, atau klien yang terpisah.",
    icon: Building2,
    primaryActionLabel: "Kembali ke Pengaturan",
    primaryActionHref: "/settings/organization",
  },
} as const satisfies Record<string, ComingSoonPreset>;

export function resolveComingSoonPreset(
  preset: ComingSoonPreset,
): ComingSoonPreset {
  return {
    ...DEFAULT_COMING_SOON,
    ...preset,
  };
}

export type DesignSystemColorToken = {
  id: string;
  label: string;
  description: string;
  swatchClass: string;
  textClass: string;
  ringClass: string;
  hex: string;
};

export const designSystemColors: DesignSystemColorToken[] = [
  {
    id: "primary",
    label: "Primary",
    description: "Aksi utama, CTA, fokus navigasi",
    swatchClass: "bg-slate-950",
    textClass: "text-slate-950",
    ringClass: "ring-slate-950/20",
    hex: "#020617",
  },
  {
    id: "success",
    label: "Success",
    description: "Status selesai, lunas, aktif",
    swatchClass: "bg-emerald-600",
    textClass: "text-emerald-700",
    ringClass: "ring-emerald-200",
    hex: "#059669",
  },
  {
    id: "warning",
    label: "Warning",
    description: "Menunggu, perlu perhatian ringan",
    swatchClass: "bg-amber-500",
    textClass: "text-amber-700",
    ringClass: "ring-amber-200",
    hex: "#F59E0B",
  },
  {
    id: "danger",
    label: "Danger",
    description: "Error, terlambat, bermasalah",
    swatchClass: "bg-red-600",
    textClass: "text-red-700",
    ringClass: "ring-red-200",
    hex: "#DC2626",
  },
  {
    id: "info",
    label: "Info",
    description: "Informasi, diproses, netral positif",
    swatchClass: "bg-sky-600",
    textClass: "text-sky-700",
    ringClass: "ring-sky-200",
    hex: "#0284C7",
  },
  {
    id: "neutral",
    label: "Neutral",
    description: "Teks sekunder, border, latar netral",
    swatchClass: "bg-slate-200",
    textClass: "text-slate-600",
    ringClass: "ring-slate-200",
    hex: "#E2E8F0",
  },
];

export const designSystemTypography = {
  display: "text-4xl font-semibold tracking-tight text-slate-950",
  h1: "text-3xl font-semibold tracking-tight text-slate-950",
  h2: "text-2xl font-semibold tracking-tight text-slate-950",
  h3: "text-lg font-semibold text-slate-950",
  body: "text-sm leading-relaxed text-slate-700",
  caption: "text-xs leading-relaxed text-slate-500",
} as const;

export const designSystemCardSizes = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export const designSystemPanelClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm";

export const designSystemMutedPanelClass =
  "rounded-xl border border-dashed border-slate-200 bg-slate-50/70";

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
    description: "Aksi utama, CTA, fokus navigasi (biru brand)",
    swatchClass: "bg-primary",
    textClass: "text-primary",
    ringClass: "ring-primary/20",
    hex: "#032E6B",
  },
  {
    id: "secondary",
    label: "Secondary",
    description: "Navy brand, heading, surface sekunder",
    swatchClass: "bg-[#082253]",
    textClass: "text-[#082253]",
    ringClass: "ring-[#082253]/20",
    hex: "#082253",
  },
  {
    id: "accent",
    label: "Accent",
    description: "Highlight interaktif, gradient icon",
    swatchClass: "bg-[#366AD9]",
    textClass: "text-[#366AD9]",
    ringClass: "ring-[#366AD9]/20",
    hex: "#366AD9",
  },
  {
    id: "success",
    label: "Success",
    description: "Status selesai, lunas, WhatsApp",
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
    id: "brand",
    label: "Brand Badge",
    description: "Badge produk Desklabs (biru/navy)",
    swatchClass: "bg-primary/10",
    textClass: "text-primary",
    ringClass: "ring-primary/20",
    hex: "#032E6B",
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
  "rounded-2xl border border-soft bg-card shadow-sm";

export const designSystemMutedPanelClass =
  "rounded-xl border border-dashed border-soft bg-muted/40";

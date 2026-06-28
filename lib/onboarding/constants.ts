import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Plane,
  ShoppingBag,
} from "lucide-react";

import type { CompanySize, SolutionIndustry } from "@/lib/onboarding/types";

export type IndustryOption = {
  id: SolutionIndustry;
  label: string;
  description: string;
  icon: LucideIcon;
  status: "available" | "coming_soon";
};

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  {
    id: "travel",
    label: "Travel",
    description: "Agency, tour operator, dan operasional perjalanan",
    icon: Plane,
    status: "available",
  },
  {
    id: "education",
    label: "Education",
    description: "Sekolah, kursus, dan admission",
    icon: GraduationCap,
    status: "coming_soon",
  },
  {
    id: "property",
    label: "Property",
    description: "Developer, agent properti, dan site visit",
    icon: Building2,
    status: "coming_soon",
  },
  {
    id: "healthcare",
    label: "Healthcare",
    description: "Klinik, dental, dan layanan pasien",
    icon: HeartPulse,
    status: "coming_soon",
  },
  {
    id: "agency",
    label: "Agency",
    description: "Agency kreatif, digital, dan layanan klien",
    icon: Briefcase,
    status: "coming_soon",
  },
  {
    id: "retail",
    label: "Retail",
    description: "Retail, e-commerce, dan customer support",
    icon: ShoppingBag,
    status: "coming_soon",
  },
  {
    id: "other",
    label: "Other",
    description: "Industri lain dengan workflow customer-facing",
    icon: HelpCircle,
    status: "coming_soon",
  },
];

export const COMPANY_SIZE_OPTIONS: Array<{
  value: CompanySize;
  label: string;
}> = [
  { value: "1-5", label: "1–5 orang" },
  { value: "6-20", label: "6–20 orang" },
  { value: "21-50", label: "21–50 orang" },
  { value: "51-200", label: "51–200 orang" },
  { value: "200+", label: "200+ orang" },
];

export const FIRST_RUN_STEPS = [
  "welcome",
  "industry",
  "company",
  "invite",
  "finish",
] as const;

export type FirstRunStep = (typeof FIRST_RUN_STEPS)[number];

export const FIRST_RUN_STEP_LABELS: Record<FirstRunStep, string> = {
  welcome: "Selamat datang",
  industry: "Industri",
  company: "Perusahaan",
  invite: "Tim",
  finish: "Selesai",
};

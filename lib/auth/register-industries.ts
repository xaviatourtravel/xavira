import type { SolutionIndustry } from "@/lib/onboarding/types";

export type RegisterIndustryOption = {
  value: SolutionIndustry;
  label: string;
  available: boolean;
};

export const REGISTER_INDUSTRY_OPTIONS: RegisterIndustryOption[] = [
  { value: "travel", label: "Travel", available: true },
  { value: "education", label: "Pendidikan", available: false },
  { value: "agency", label: "Agency", available: false },
  { value: "retail", label: "Retail", available: false },
  { value: "property", label: "Property", available: false },
  { value: "healthcare", label: "Healthcare", available: false },
  { value: "other", label: "Lainnya", available: false },
];

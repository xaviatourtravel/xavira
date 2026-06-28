export const DEMO_INDUSTRY_OPTIONS = [
  { value: "travel", label: "Travel" },
  { value: "education", label: "Education" },
  { value: "property", label: "Property" },
  { value: "healthcare", label: "Healthcare" },
  { value: "agency", label: "Agency" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
] as const;

export const DEMO_COMPANY_SIZE_OPTIONS = [
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "21-50", label: "21–50" },
  { value: "51-100", label: "51–100" },
  { value: "100+", label: "100+" },
] as const;

export const DEMO_MAIN_CHALLENGE_OPTIONS = [
  { value: "too_many_apps", label: "Too many apps" },
  { value: "missed_follow_ups", label: "Missed follow-ups" },
  { value: "manual_data_entry", label: "Manual data entry" },
  { value: "slow_response_time", label: "Slow response time" },
  { value: "payment_tracking", label: "Payment tracking" },
  { value: "customer_data_scattered", label: "Customer data scattered" },
  { value: "other", label: "Other" },
] as const;

export type DemoIndustry = (typeof DEMO_INDUSTRY_OPTIONS)[number]["value"];
export type DemoCompanySize = (typeof DEMO_COMPANY_SIZE_OPTIONS)[number]["value"];
export type DemoMainChallenge = (typeof DEMO_MAIN_CHALLENGE_OPTIONS)[number]["value"];

export const DEMO_SOURCE_DETAIL = "website_demo_request";

export function isDemoIndustry(value: string): value is DemoIndustry {
  return DEMO_INDUSTRY_OPTIONS.some((option) => option.value === value);
}

export function isDemoCompanySize(value: string): value is DemoCompanySize {
  return DEMO_COMPANY_SIZE_OPTIONS.some((option) => option.value === value);
}

export function isDemoMainChallenge(value: string): value is DemoMainChallenge {
  return DEMO_MAIN_CHALLENGE_OPTIONS.some((option) => option.value === value);
}

export function getDemoIndustryLabel(value: string) {
  return DEMO_INDUSTRY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getDemoCompanySizeLabel(value: string) {
  return DEMO_COMPANY_SIZE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getDemoMainChallengeLabel(value: string) {
  return DEMO_MAIN_CHALLENGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

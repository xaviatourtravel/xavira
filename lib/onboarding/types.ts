export const SOLUTION_INDUSTRIES = [
  "travel",
  "education",
  "property",
  "healthcare",
  "agency",
  "retail",
  "other",
] as const;

export type SolutionIndustry = (typeof SOLUTION_INDUSTRIES)[number];

export const COMPANY_SIZES = [
  "1-5",
  "6-20",
  "21-50",
  "51-200",
  "200+",
] as const;

export type CompanySize = (typeof COMPANY_SIZES)[number];

export type SolutionPackModuleStatus = "available" | "coming_soon";

export type SolutionPackConfig = {
  enabled: boolean;
  modules: string[];
  status: SolutionPackModuleStatus;
};

export type OrganizationProductSettings = {
  primaryIndustry: SolutionIndustry;
  packs: Record<string, SolutionPackConfig>;
};

export type FirstRunSettings = {
  pending: boolean;
  completedAt: string | null;
  completedBy: string | null;
  industry: SolutionIndustry | null;
  workspaceName: string | null;
  companySize: CompanySize | null;
  invitedEmails: string[];
};

export type FirstRunWizardPayload = {
  industry: SolutionIndustry;
  companyName: string;
  workspaceName: string;
  companySize: CompanySize;
  inviteEmails: string[];
};

export type SetupGuideCardId =
  | "leads"
  | "inbox"
  | "team"
  | "packages";

export type SetupGuideCard = {
  id: SetupGuideCardId;
  title: string;
  description: string;
  href: string;
  cta: string;
};

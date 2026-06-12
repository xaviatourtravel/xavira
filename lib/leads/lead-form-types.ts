import type { CampaignOption } from "@/lib/campaigns/constants";

export type LeadFormPackageOption = {
  id: string;
  name: string;
};

export type LeadFormProfileOption = {
  id: string;
  full_name: string | null;
};

export type LeadFormValues = {
  full_name?: string;
  whatsapp_number?: string | null;
  email?: string | null;
  source?: string;
  lead_date?: string | null;
  package_interest?: string | null;
  status?: string;
  assigned_to?: string | null;
  campaign_id?: string | null;
  budget_idr?: number | null;
  party_size?: number | null;
  travel_date_preference?: string | null;
  notes?: string | null;
  lead_temperature?: string | null;
};

export type LeadFormOptions = {
  packages: LeadFormPackageOption[];
  campaigns: CampaignOption[];
  orgProfiles: LeadFormProfileOption[];
};

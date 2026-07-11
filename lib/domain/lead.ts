export type Lead = {
  id: string;
  fullName: string;
  status: string;
  email: string | null;
  phone: string | null;
  source: string;
  packageInterest: string | null;
  travelDatePreference: string | null;
  partySize: number | null;
  budgetIdr: number | null;
  assignedToId: string | null;
  assignedToName: string | null;
  healthScore: number | null;
  healthBadge: string | null;
  tags: string[];
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Normalized lead row shape from CRM tables. */
export type LeadRow = {
  id: string;
  full_name: string | null;
  status: string;
  assigned_to: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  source: string;
  package_interest: string | null;
  travel_date_preference: string | null;
  party_size: number | null;
  budget_idr: number | null;
  updated_at: string;
  created_at: string;
  last_contacted_at: string | null;
};

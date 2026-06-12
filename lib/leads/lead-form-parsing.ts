import { parseLeadDateInput, resolveLeadDateForCreate } from "@/lib/leads/lead-date";
import { parseLeadTemperatureInput } from "@/lib/leads/lead-temperature";
import { parseLeadSourceForSave } from "@/lib/leads/source-tracking";

export function getLeadFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getLeadFormOptionalInt(
  formData: FormData,
  key: string,
): number | null {
  const value = getLeadFormString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export type ParsedLeadFormFields = {
  fullName: string;
  whatsappNumber: string;
  email: string;
  source: ReturnType<typeof parseLeadSourceForSave>;
  packageInterest: string;
  status: string;
  budgetIdr: number | null;
  travelDatePreference: string;
  partySize: number | null;
  notes: string;
  assignedTo: string;
  campaignIdInput: string;
  leadDate: string | null;
  leadDateForCreate: string;
  leadTemperature: ReturnType<typeof parseLeadTemperatureInput>;
};

export function parseLeadFormFields(formData: FormData): ParsedLeadFormFields {
  const leadDateRaw = getLeadFormString(formData, "lead_date");

  return {
    fullName: getLeadFormString(formData, "full_name"),
    whatsappNumber: getLeadFormString(formData, "whatsapp_number"),
    email: getLeadFormString(formData, "email"),
    source: parseLeadSourceForSave(getLeadFormString(formData, "source")),
    packageInterest: getLeadFormString(formData, "package_interest"),
    status: getLeadFormString(formData, "status") || "new",
    budgetIdr: getLeadFormOptionalInt(formData, "budget_idr"),
    travelDatePreference: getLeadFormString(formData, "travel_date_preference"),
    partySize: getLeadFormOptionalInt(formData, "party_size"),
    notes: getLeadFormString(formData, "notes"),
    assignedTo: getLeadFormString(formData, "assigned_to"),
    campaignIdInput: getLeadFormString(formData, "campaign_id"),
    leadDate: parseLeadDateInput(leadDateRaw),
    leadDateForCreate: resolveLeadDateForCreate(leadDateRaw),
    leadTemperature: parseLeadTemperatureInput(
      getLeadFormString(formData, "lead_temperature"),
    ),
  };
}

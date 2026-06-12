import { getLeadAgingCutoffIso } from "@/lib/leads/assignment";

export const LEAD_TEMPERATURE_VALUES = ["hot", "warm", "cold"] as const;

export type LeadTemperature = (typeof LEAD_TEMPERATURE_VALUES)[number];

export type LeadTemperatureFilter =
  | LeadTemperature
  | "not_set"
  | (string & {});

export type LeadForTemperature = {
  id?: string;
  lead_temperature: string | null;
  status: string;
  updated_at: string;
};

export function isLeadTemperature(value: string): value is LeadTemperature {
  return LEAD_TEMPERATURE_VALUES.includes(value as LeadTemperature);
}

export function parseLeadTemperatureInput(value: string): LeadTemperature | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "auto") {
    return null;
  }

  return isLeadTemperature(trimmed) ? trimmed : null;
}

export function parseLeadTemperatureFilter(
  value: string,
): LeadTemperatureFilter | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed === "not_set" || isLeadTemperature(trimmed)) {
    return trimmed;
  }

  return null;
}

export function getLeadTemperatureFilterLabel(filter: LeadTemperatureFilter) {
  switch (filter) {
    case "hot":
      return "Temperature: Hot";
    case "warm":
      return "Temperature: Warm";
    case "cold":
      return "Temperature: Cold";
    case "not_set":
      return "Temperature: Not Set";
    default:
      return "Temperature";
  }
}

export function getSuggestedLeadTemperature(lead: LeadForTemperature): LeadTemperature {
  if (["proposal_sent", "negotiating", "won"].includes(lead.status)) {
    return "hot";
  }

  if (["contacted", "qualified"].includes(lead.status)) {
    return "warm";
  }

  if (lead.status === "lost") {
    return "cold";
  }

  if (lead.status === "new" && lead.updated_at < getLeadAgingCutoffIso(3)) {
    return "cold";
  }

  return "warm";
}

export function getEffectiveLeadTemperature(lead: LeadForTemperature) {
  if (lead.lead_temperature && isLeadTemperature(lead.lead_temperature)) {
    return {
      value: lead.lead_temperature,
      isSuggested: false as const,
    };
  }

  return {
    value: getSuggestedLeadTemperature(lead),
    isSuggested: true as const,
  };
}

export function getLeadTemperatureLabel(
  temperature: LeadTemperature,
  isSuggested: boolean,
) {
  const base =
    temperature === "hot" ? "Hot" : temperature === "warm" ? "Warm" : "Cold";

  return isSuggested ? `${base} (Suggested)` : base;
}

export function getLeadTemperatureBadgeClassName(temperature: LeadTemperature) {
  switch (temperature) {
    case "hot":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "warm":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cold":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function leadMatchesTemperatureFilter(
  lead: LeadForTemperature & { id: string },
  filter: LeadTemperatureFilter,
) {
  if (filter === "not_set") {
    return lead.lead_temperature == null;
  }

  return getEffectiveLeadTemperature(lead).value === filter;
}

export function getLeadIdsForTemperatureFilter(
  leads: Array<LeadForTemperature & { id: string }>,
  filter: LeadTemperatureFilter,
) {
  return leads
    .filter((lead) => leadMatchesTemperatureFilter(lead, filter))
    .map((lead) => lead.id);
}

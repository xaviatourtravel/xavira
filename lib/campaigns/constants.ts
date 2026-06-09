import type { Database } from "@/types/database";

export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Draft" },
] as const satisfies ReadonlyArray<{ value: CampaignStatus; label: string }>;

const CAMPAIGN_STATUS_SET = new Set<string>(
  CAMPAIGN_STATUS_OPTIONS.map((option) => option.value),
);

export function parseCampaignStatus(value: string): CampaignStatus {
  if (CAMPAIGN_STATUS_SET.has(value)) {
    return value as CampaignStatus;
  }

  return "active";
}

export function formatCampaignStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export type CampaignOption = {
  id: string;
  name: string;
  status: CampaignStatus;
};

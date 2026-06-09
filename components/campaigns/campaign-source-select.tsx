"use client";

import { LEAD_SOURCE_OPTIONS } from "@/lib/leads/source-tracking";

type CampaignSourceSelectProps = {
  name?: string;
  defaultValue?: string;
  className?: string;
  required?: boolean;
};

export function CampaignSourceSelect({
  name = "source",
  defaultValue = "other",
  className,
  required = false,
}: CampaignSourceSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      required={required}
      className={className}
    >
      {LEAD_SOURCE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

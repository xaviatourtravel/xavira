"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import { getLeadSourceOptions } from "@/lib/leads/source-tracking";

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
  const { locale } = useTranslation();
  const options = getLeadSourceOptions(locale);

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      required={required}
      className={className}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

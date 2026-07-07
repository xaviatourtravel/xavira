"use client";

import { DEFAULT_LEAD_SOURCE, LEAD_SOURCES } from "@/constants/lead-sources";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  formatLeadSourceLabel,
  getLeadSourceOptions,
} from "@/lib/leads/source-tracking";

type LeadSourceSelectProps = {
  name?: string;
  defaultValue?: string;
  className?: string;
  id?: string;
};

export function LeadSourceSelect({
  name = "source",
  defaultValue = DEFAULT_LEAD_SOURCE,
  className,
  id,
}: LeadSourceSelectProps) {
  const { locale } = useTranslation();
  const options = getLeadSourceOptions(locale);
  const resolvedValue = LEAD_SOURCES.some((option) => option.value === defaultValue)
    ? defaultValue
    : DEFAULT_LEAD_SOURCE;

  return (
    <select
      id={id}
      name={name}
      defaultValue={resolvedValue}
      className={className}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {!LEAD_SOURCES.some((option) => option.value === defaultValue) && defaultValue ? (
        <option value={defaultValue}>
          {formatLeadSourceLabel(defaultValue, locale)} (Legacy)
        </option>
      ) : null}
    </select>
  );
}

import {
  DEFAULT_LEAD_SOURCE,
  formatLeadSourceLabel,
  LEAD_SOURCE_OPTIONS,
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
  const resolvedValue = LEAD_SOURCE_OPTIONS.some(
    (option) => option.value === defaultValue,
  )
    ? defaultValue
    : DEFAULT_LEAD_SOURCE;

  return (
    <select
      id={id}
      name={name}
      defaultValue={resolvedValue}
      className={className}
    >
      {LEAD_SOURCE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {!LEAD_SOURCE_OPTIONS.some((option) => option.value === defaultValue) &&
        defaultValue && (
          <option value={defaultValue}>
            {formatLeadSourceLabel(defaultValue)} (Legacy)
          </option>
        )}
    </select>
  );
}

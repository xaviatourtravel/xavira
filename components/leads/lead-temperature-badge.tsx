import {
  getLeadTemperatureBadgeClassName,
  getLeadTemperatureLabel,
  type LeadTemperature,
} from "@/lib/leads/lead-temperature";
import { cn } from "@/lib/utils";

type LeadTemperatureBadgeProps = {
  value: LeadTemperature;
  isSuggested?: boolean;
  className?: string;
};

export function LeadTemperatureBadge({
  value,
  isSuggested = false,
  className,
}: LeadTemperatureBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        getLeadTemperatureBadgeClassName(value),
        className,
      )}
    >
      <span>{getLeadTemperatureLabel(value, false)}</span>
      {isSuggested && (
        <span className="font-normal opacity-80">Suggested</span>
      )}
    </span>
  );
}

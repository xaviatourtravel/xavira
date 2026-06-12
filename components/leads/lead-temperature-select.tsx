import { cn } from "@/lib/utils";

type LeadTemperatureSelectProps = {
  name?: string;
  defaultValue?: string | null;
  className?: string;
  disabled?: boolean;
};

export function LeadTemperatureSelect({
  name = "lead_temperature",
  defaultValue = "",
  className,
  disabled = false,
}: LeadTemperatureSelectProps) {
  const resolvedValue =
    defaultValue === "hot" ||
    defaultValue === "warm" ||
    defaultValue === "cold"
      ? defaultValue
      : "";

  return (
    <select
      name={name}
      defaultValue={resolvedValue}
      disabled={disabled}
      className={cn(className)}
    >
      <option value="">Auto / Not Set</option>
      <option value="hot">Hot</option>
      <option value="warm">Warm</option>
      <option value="cold">Cold</option>
    </select>
  );
}

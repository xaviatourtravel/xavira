"use client";

import { cn } from "@/lib/utils";

export type SegmentedControlOption = {
  value: string;
  label: string;
};

export type SegmentedControlProps = {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedControlOption[];
  disabled?: boolean;
  "aria-label"?: string;
};

export function SegmentedControl({
  value,
  onChange,
  options,
  disabled = false,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (!disabled) {
                onChange(option.value);
              }
            }}
            className={cn(
              "inline-flex items-center rounded-lg border px-3 py-2 text-sm transition-colors",
              disabled && "cursor-not-allowed opacity-50",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

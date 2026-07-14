"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  formatIdrGrouped,
  parseIdrInputToMinor,
} from "@/modules/finance/lib/invoice-money";
import { cn } from "@/lib/utils";

type InvoiceMoneyInputProps = {
  id?: string;
  name?: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Localized IDR money input (integer minor units).
 * Displays Indonesian thousand separators while typing.
 */
export function InvoiceMoneyInput({
  id,
  name,
  value,
  onValueChange,
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
}: InvoiceMoneyInputProps) {
  const [text, setText] = useState(() =>
    value == null ? "" : formatIdrGrouped(value),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = value == null ? "" : formatIdrGrouped(value);
    setText((current) => {
      try {
        const parsed = parseIdrInputToMinor(current);
        if (parsed === value || (parsed == null && value == null)) {
          return current;
        }
      } catch {
        // keep local text while invalid
        return current;
      }
      return next;
    });
  }, [value]);

  function commit(raw: string) {
    try {
      const parsed = parseIdrInputToMinor(raw);
      setError(null);
      onValueChange(parsed);
      setText(parsed == null ? "" : formatIdrGrouped(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid amount");
    }
  }

  return (
    <div className="space-y-1">
      <Input
        id={id}
        name={name}
        inputMode="numeric"
        autoComplete="off"
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        className={cn(className, error && "border-rose-400")}
        value={text}
        onChange={(event) => {
          const raw = event.target.value;
          try {
            const parsed = parseIdrInputToMinor(raw);
            setError(null);
            onValueChange(parsed);
            setText(parsed == null ? "" : formatIdrGrouped(parsed));
          } catch (err) {
            setText(raw);
            setError(err instanceof Error ? err.message : "Invalid amount");
          }
        }}
        onBlur={() => commit(text)}
      />
      {error ? (
        <p className="text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

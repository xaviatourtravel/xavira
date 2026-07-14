"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import { saveInvoicePrefixAction } from "@/modules/finance/actions/invoice-actions";
import { normalizeInvoicePrefix } from "@/modules/finance/lib/invoice-money";

type InvoicePrefixSettingsProps = {
  initialPrefix: string | null;
};

export function InvoicePrefixSettings({
  initialPrefix,
}: InvoicePrefixSettingsProps) {
  const { tStrict } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [prefix, setPrefix] = useState(initialPrefix ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="rounded-2xl border bg-card px-4 py-4 space-y-3 max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await saveInvoicePrefixAction({
            invoicePrefix: prefix.trim() ? prefix : null,
          });
          if (!result.success) {
            setError(result.message);
            return;
          }
          setPrefix(result.invoicePrefix ?? "");
          setMessage(tStrict("financeUi.invoicePrefixSaved"));
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="invoice_prefix">
          {tStrict("financeUi.invoicePrefixLabel")}
        </Label>
        <p className="text-xs text-muted-foreground">
          {tStrict("financeUi.invoicePrefixHelper")}
        </p>
      </div>
      <Input
        id="invoice_prefix"
        name="invoice_prefix"
        value={prefix}
        maxLength={10}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        className={error ? "border-rose-400 uppercase" : "uppercase"}
        onChange={(event) => {
          const next = normalizeInvoicePrefix(event.target.value) ?? "";
          setPrefix(next.slice(0, 10));
          setError(null);
          setMessage(null);
        }}
        placeholder="XAVIA"
      />
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} size="sm">
        {tStrict("financeUi.saveInvoicePrefix")}
      </Button>
    </form>
  );
}

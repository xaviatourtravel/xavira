"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import { saveInvoiceBrandSettingsAction } from "@/modules/finance/actions/invoice-actions";
import { PaymentAccountsEditor } from "@/modules/finance/components/payment-accounts-editor";
import {
  coercePaymentAccounts,
  invoicePaymentAccountsSchema,
  type InvoicePaymentAccount,
} from "@/modules/finance/lib/invoice-payment-accounts";
import { normalizeInvoicePrefix } from "@/modules/finance/lib/invoice-money";
import { listInvoiceTemplates } from "@/modules/finance/pdf/invoice-template-registry";

type InvoiceBrandSettingsFormProps = {
  initial: {
    defaultTemplateKey: string;
    footerText: string | null;
    invoicePrefix: string | null;
    paymentAccountsJson: unknown;
    workspace: {
      legalName: string | null;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      logoPreviewUrl: string | null;
    };
  };
};

export function InvoiceBrandSettingsForm({
  initial,
}: InvoiceBrandSettingsFormProps) {
  const { tStrict } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<InvoicePaymentAccount[]>(() =>
    coercePaymentAccounts(initial.paymentAccountsJson),
  );
  const templates = listInvoiceTemplates();

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const parsed = invoicePaymentAccountsSchema.safeParse(accounts);
          if (!parsed.success) {
            setError(
              parsed.error.issues[0]?.message ??
                tStrict("financeUi.paymentAccountsInvalid"),
            );
            return;
          }
          const result = await saveInvoiceBrandSettingsAction({
            defaultTemplateKey: String(form.get("default_template_key") ?? ""),
            footerText: String(form.get("footer_text") ?? "") || null,
            invoicePrefix: String(form.get("invoice_prefix") ?? "") || null,
            paymentAccountsJson: parsed.data,
          });
          if (!result.success) {
            setError(result.message);
            return;
          }
          setAccounts(parsed.data);
          setMessage(tStrict("financeUi.brandSettingsSaved"));
        });
      }}
    >
      <section className="space-y-3 rounded-xl border bg-muted/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">
              {tStrict("orgBrandingUi.inheritedFromWorkspace")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {initial.workspace.legalName || "—"}
            </p>
          </div>
          <Link
            href="/settings/organization/branding"
            className="text-sm font-medium text-primary hover:underline"
          >
            {tStrict("orgBrandingUi.manageWorkspaceBranding")}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {initial.workspace.logoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={initial.workspace.logoPreviewUrl}
              alt=""
              className="h-12 w-auto rounded border bg-white object-contain p-1"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {tStrict("financeUi.logoFromWorkspace")}
            </p>
          )}
          <div className="flex gap-2">
            <span
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: initial.workspace.primaryColor }}
              title={initial.workspace.primaryColor}
            />
            <span
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: initial.workspace.secondaryColor }}
              title={initial.workspace.secondaryColor}
            />
            <span
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: initial.workspace.accentColor }}
              title={initial.workspace.accentColor}
            />
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="default_template_key">
          {tStrict("financeUi.defaultTemplate")}
        </Label>
        <select
          id="default_template_key"
          name="default_template_key"
          defaultValue={initial.defaultTemplateKey}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {templates.map((template) => (
            <option key={template.key} value={template.key}>
              {template.ticketId ? `${template.ticketId} · ` : ""}
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice_prefix">
          {tStrict("financeUi.invoicePrefixLabel")}
        </Label>
        <Input
          id="invoice_prefix"
          name="invoice_prefix"
          defaultValue={initial.invoicePrefix ?? ""}
          maxLength={10}
          className="uppercase"
          onInput={(event) => {
            const target = event.currentTarget;
            target.value = (normalizeInvoicePrefix(target.value) ?? "").slice(
              0,
              10,
            );
          }}
        />
        <p className="text-xs text-muted-foreground">
          {tStrict("financeUi.invoicePrefixHelper")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="footer_text">{tStrict("financeUi.footerText")}</Label>
        <textarea
          id="footer_text"
          name="footer_text"
          rows={2}
          defaultValue={initial.footerText ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <PaymentAccountsEditor
        value={accounts}
        onChange={setAccounts}
        disabled={pending}
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

      <Button type="submit" disabled={pending}>
        {tStrict("financeUi.saveBrandSettings")}
      </Button>
    </form>
  );
}

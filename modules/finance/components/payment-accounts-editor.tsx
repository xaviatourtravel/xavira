"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  createEmptyPaymentAccount,
  invoicePaymentAccountsSchema,
  reorderPaymentAccounts,
  setDefaultPaymentAccount,
  type InvoicePaymentAccount,
} from "@/modules/finance/lib/invoice-payment-accounts";

type PaymentAccountsEditorProps = {
  value: InvoicePaymentAccount[];
  onChange: (next: InvoicePaymentAccount[]) => void;
  disabled?: boolean;
};

export function PaymentAccountsEditor({
  value,
  onChange,
  disabled = false,
}: PaymentAccountsEditorProps) {
  const { tStrict } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(
    value[0]?.id ?? null,
  );

  const validationMessage = useMemo(() => {
    const result = invoicePaymentAccountsSchema.safeParse(value);
    if (result.success) return null;
    return result.error.issues[0]?.message ?? tStrict("financeUi.paymentAccountsInvalid");
  }, [value, tStrict]);

  function updateAccount(
    id: string,
    patch: Partial<InvoicePaymentAccount>,
  ) {
    onChange(
      value.map((account) =>
        account.id === id ? { ...account, ...patch } : account,
      ),
    );
  }

  function addAccount() {
    const next = createEmptyPaymentAccount(value.length);
    if (value.length === 0) next.isDefault = true;
    onChange([...value, next]);
    setExpandedId(next.id);
  }

  function removeAccount(id: string) {
    const remaining = value.filter((account) => account.id !== id);
    if (remaining.length > 0 && !remaining.some((account) => account.isDefault)) {
      const firstEnabled = remaining.find((account) => account.enabled) ?? remaining[0]!;
      onChange(
        remaining.map((account) => ({
          ...account,
          isDefault: account.id === firstEnabled.id,
          sortOrder: remaining.indexOf(account),
        })),
      );
    } else {
      onChange(remaining.map((account, index) => ({ ...account, sortOrder: index })));
    }
    if (expandedId === id) setExpandedId(remaining[0]?.id ?? null);
  }

  return (
    <section className="space-y-3" aria-labelledby="payment-accounts-heading">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="payment-accounts-heading"
            className="text-sm font-semibold tracking-wide text-muted-foreground"
          >
            {tStrict("financeUi.paymentAccounts")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {tStrict("financeUi.paymentAccountsHelper")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= 20}
          onClick={addAccount}
        >
          {tStrict("financeUi.paymentAccountAdd")}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          {tStrict("financeUi.paymentAccountsEmpty")}
        </p>
      ) : null}

      <ul className="space-y-3">
        {value.map((account, index) => {
          const open = expandedId === account.id;
          return (
            <li
              key={account.id}
              className="rounded-xl border bg-background p-3 shadow-none"
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() =>
                    setExpandedId(open ? null : account.id)
                  }
                  aria-expanded={open}
                >
                  <p className="truncate text-sm font-medium">
                    {account.bankName || tStrict("financeUi.paymentAccountUntitled")}
                    {account.isDefault ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({tStrict("financeUi.paymentAccountDefault")})
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {account.accountNumber || "—"}
                    {account.accountHolder ? ` · ${account.accountHolder}` : ""}
                    {!account.enabled
                      ? ` · ${tStrict("financeUi.paymentAccountDisabled")}`
                      : ""}
                  </p>
                </button>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === 0}
                    onClick={() =>
                      onChange(reorderPaymentAccounts(value, index, index - 1))
                    }
                    aria-label={tStrict("financeUi.paymentAccountMoveUp")}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === value.length - 1}
                    onClick={() =>
                      onChange(reorderPaymentAccounts(value, index, index + 1))
                    }
                    aria-label={tStrict("financeUi.paymentAccountMoveDown")}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => removeAccount(account.id)}
                  >
                    {tStrict("financeUi.paymentAccountDelete")}
                  </Button>
                </div>
              </div>

              {open ? (
                <div className="mt-3 grid gap-3 border-t pt-3 md:grid-cols-2">
                  <Field
                    label={tStrict("financeUi.paymentAccountBankName")}
                    value={account.bankName}
                    disabled={disabled}
                    onChange={(next) =>
                      updateAccount(account.id, { bankName: next })
                    }
                    required
                  />
                  <Field
                    label={tStrict("financeUi.paymentAccountNumber")}
                    value={account.accountNumber}
                    disabled={disabled}
                    onChange={(next) =>
                      updateAccount(account.id, { accountNumber: next })
                    }
                    required
                  />
                  <Field
                    label={tStrict("financeUi.paymentAccountHolder")}
                    value={account.accountHolder}
                    disabled={disabled}
                    onChange={(next) =>
                      updateAccount(account.id, { accountHolder: next })
                    }
                    required
                  />
                  <Field
                    label={tStrict("financeUi.paymentAccountBranch")}
                    value={account.branch ?? ""}
                    disabled={disabled}
                    onChange={(next) =>
                      updateAccount(account.id, {
                        branch: next.trim() || null,
                      })
                    }
                  />
                  <Field
                    label={tStrict("financeUi.paymentAccountSwift")}
                    value={account.swiftCode ?? ""}
                    disabled={disabled}
                    onChange={(next) =>
                      updateAccount(account.id, {
                        swiftCode: next.trim() || null,
                      })
                    }
                  />
                  <Field
                    label={tStrict("financeUi.paymentAccountNotes")}
                    value={account.notes ?? ""}
                    disabled={disabled}
                    onChange={(next) =>
                      updateAccount(account.id, {
                        notes: next.trim() || null,
                      })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm md:col-span-1">
                    <input
                      type="checkbox"
                      checked={account.enabled}
                      disabled={disabled}
                      onChange={(event) =>
                        updateAccount(account.id, {
                          enabled: event.target.checked,
                          isDefault: event.target.checked
                            ? account.isDefault
                            : false,
                        })
                      }
                    />
                    {tStrict("financeUi.paymentAccountEnabled")}
                  </label>
                  <label className="flex items-center gap-2 text-sm md:col-span-1">
                    <input
                      type="radio"
                      name="default_payment_account"
                      checked={account.isDefault}
                      disabled={disabled || !account.enabled}
                      onChange={() =>
                        onChange(setDefaultPaymentAccount(value, account.id))
                      }
                    />
                    {tStrict("financeUi.paymentAccountSetDefault")}
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {validationMessage && value.length > 0 ? (
        <p className="text-xs text-amber-700" role="status">
          {validationMessage}
        </p>
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

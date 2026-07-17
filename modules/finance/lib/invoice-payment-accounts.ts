import { z } from "zod";

/**
 * Structured payment accounts stored in invoice_brand_settings.payment_accounts_json.
 * Snapshots copy this array into invoices.company_snapshot.paymentAccounts at issue time.
 *
 * Future methods (qris, virtual_account, card, midtrans, xendit, stripe) can extend
 * `method` without a schema migration. Gateways are NOT implemented in FIN-001.3B.
 */

export const PAYMENT_ACCOUNT_METHODS = [
  "bank_transfer",
  "qris",
  "virtual_account",
  "card",
  "midtrans",
  "xendit",
  "stripe",
  "other",
] as const;

export type PaymentAccountMethod = (typeof PAYMENT_ACCOUNT_METHODS)[number];

export type InvoicePaymentAccount = {
  id: string;
  method: PaymentAccountMethod;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string | null;
  swiftCode: string | null;
  notes: string | null;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
};

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => {
      if (value == null || value === "") return null;
      return value;
    });

export const invoicePaymentAccountSchema = z.object({
  id: z.string().trim().min(1).max(64),
  method: z.enum(PAYMENT_ACCOUNT_METHODS).default("bank_transfer"),
  bankName: z.string().trim().min(1).max(80),
  accountNumber: z.string().trim().min(1).max(64),
  accountHolder: z.string().trim().min(1).max(120),
  branch: optionalTrimmed(80),
  swiftCode: optionalTrimmed(32),
  notes: optionalTrimmed(240),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const invoicePaymentAccountsSchema = z
  .array(invoicePaymentAccountSchema)
  .max(20)
  .superRefine((accounts, ctx) => {
    const defaults = accounts.filter((account) => account.isDefault);
    if (defaults.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one payment account can be the default.",
      });
    }
    const enabled = accounts.filter((account) => account.enabled);
    if (accounts.length > 0 && enabled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one payment account must be enabled.",
      });
    }
    if (defaults.length === 1 && !defaults[0]!.enabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The default payment account must be enabled.",
      });
    }
  })
  .transform((accounts) =>
    [...accounts]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.bankName.localeCompare(b.bankName))
      .map((account, index) => ({ ...account, sortOrder: index })),
  );

export type InvoicePaymentAccountInput = z.input<typeof invoicePaymentAccountSchema>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function newAccountId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Normalize legacy JSON (snake_case / missing fields) into structured accounts. */
export function coercePaymentAccounts(raw: unknown): InvoicePaymentAccount[] {
  if (!Array.isArray(raw)) return [];

  const coerced = raw.map((entry, index) => {
    const row = asRecord(entry);
    const methodRaw = readString(row.method)?.toLowerCase() ?? "bank_transfer";
    const method = (PAYMENT_ACCOUNT_METHODS as readonly string[]).includes(methodRaw)
      ? (methodRaw as PaymentAccountMethod)
      : "bank_transfer";

    return {
      id: readString(row.id) ?? newAccountId(),
      method,
      bankName:
        readString(row.bankName) ??
        readString(row.bank_name) ??
        readString(row.bank) ??
        readString(row.label) ??
        "",
      accountNumber:
        readString(row.accountNumber) ??
        readString(row.account_number) ??
        "",
      accountHolder:
        readString(row.accountHolder) ??
        readString(row.account_holder) ??
        readString(row.accountName) ??
        readString(row.account_name) ??
        "",
      branch: readString(row.branch) ?? readString(row.branchName),
      swiftCode:
        readString(row.swiftCode) ??
        readString(row.swift_code) ??
        readString(row.bankCode) ??
        readString(row.bank_code),
      notes: readString(row.notes),
      enabled: row.enabled === false || row.enabled === "false" ? false : true,
      isDefault: Boolean(row.isDefault ?? row.is_default ?? index === 0),
      sortOrder:
        typeof row.sortOrder === "number"
          ? row.sortOrder
          : typeof row.sort_order === "number"
            ? row.sort_order
            : index,
    };
  });

  // Soft-coerce: drop empty legacy rows before strict validate
  const nonempty = coerced.filter(
    (account) => account.bankName || account.accountNumber || account.accountHolder,
  );

  // Ensure at most one default among enabled rows when coercing dirty data
  let seenDefault = false;
  const normalized = nonempty.map((account) => {
    if (!account.isDefault) return account;
    if (seenDefault || !account.enabled) {
      return { ...account, isDefault: false };
    }
    seenDefault = true;
    return account;
  });
  if (!seenDefault && normalized.some((account) => account.enabled)) {
    const firstEnabled = normalized.findIndex((account) => account.enabled);
    if (firstEnabled >= 0) {
      normalized[firstEnabled] = {
        ...normalized[firstEnabled]!,
        isDefault: true,
      };
    }
  }

  const parsed = invoicePaymentAccountsSchema.safeParse(normalized);
  if (parsed.success) return parsed.data;
  // Last resort: return empty rather than corrupt settings UI
  return [];
}

export function parsePaymentAccountsStrict(raw: unknown): InvoicePaymentAccount[] {
  return invoicePaymentAccountsSchema.parse(coercePaymentAccounts(raw));
}

export function createEmptyPaymentAccount(
  sortOrder = 0,
): InvoicePaymentAccount {
  return {
    id: newAccountId(),
    method: "bank_transfer",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    branch: null,
    swiftCode: null,
    notes: null,
    enabled: true,
    isDefault: sortOrder === 0,
    sortOrder,
  };
}

export function reorderPaymentAccounts(
  accounts: InvoicePaymentAccount[],
  fromIndex: number,
  toIndex: number,
): InvoicePaymentAccount[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= accounts.length ||
    toIndex >= accounts.length ||
    fromIndex === toIndex
  ) {
    return accounts.map((account, index) => ({ ...account, sortOrder: index }));
  }
  const next = [...accounts];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);
  return next.map((account, index) => ({ ...account, sortOrder: index }));
}

export function setDefaultPaymentAccount(
  accounts: InvoicePaymentAccount[],
  id: string,
): InvoicePaymentAccount[] {
  return accounts.map((account) => ({
    ...account,
    isDefault: account.id === id,
    enabled: account.id === id ? true : account.enabled,
  }));
}

/** Accounts that should appear on invoices/PDFs (enabled only, default first). */
export function enabledPaymentAccountsForDocuments(
  accounts: InvoicePaymentAccount[],
): InvoicePaymentAccount[] {
  return accounts
    .filter((account) => account.enabled)
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
}

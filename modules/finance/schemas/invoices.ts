import { z } from "zod";
import { INVOICE_TEMPLATE_KEYS } from "@/modules/finance/pdf/invoice-pdf-types";
import { isValidHexColor, normalizeHexColor } from "@/modules/finance/lib/invoice-theme-colors";
import { parsePaymentAccountsStrict } from "@/modules/finance/lib/invoice-payment-accounts";

const hexColorSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const upper = value.startsWith("#") ? value.toUpperCase() : `#${value.toUpperCase()}`;
    if (
      /gradient|url\(|rgb\(|hsl\(|var\(/i.test(value) ||
      !isValidHexColor(upper)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Color must be #RRGGBB",
      });
    }
  })
  .transform((value) => normalizeHexColor(value));

const invoiceTemplateKeySchema = z
  .string()
  .trim()
  .transform((value) => {
    const key = value.toLowerCase();
    return (INVOICE_TEMPLATE_KEYS as readonly string[]).includes(key)
      ? (key as (typeof INVOICE_TEMPLATE_KEYS)[number])
      : "calm-standard";
  });

const minorSchema = z
  .number({ invalid_type_error: "must be an integer minor unit" })
  .int("must be an integer minor unit")
  .nonnegative("cannot be negative");

const quantitySchema = z
  .number({ invalid_type_error: "quantity must be a number" })
  .positive("quantity must be positive")
  .finite();

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

const optionalEmailSchema = z
  .string()
  .trim()
  .max(320)
  .nullable()
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    return value;
  })
  .refine((value) => value == null || z.string().email().safeParse(value).success, {
    message: "invalid email",
  });

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(32)
  .nullable()
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    return value;
  })
  .refine((value) => value == null || (value.length >= 6 && value.length <= 32), {
    message: "phone length must be between 6 and 32",
  });

export const invoiceLifecycleStatusSchema = z.enum([
  "draft",
  "issued",
  "sent",
  "void",
]);

export const invoicePaymentStatusSchema = z.enum([
  "unpaid",
  "partially_paid",
  "paid",
]);

export const invoiceEffectivePaymentStatusSchema = z.enum([
  "unpaid",
  "partially_paid",
  "paid",
  "overdue",
]);

export const invoiceRecipientSourceSchema = z.enum([
  "linked_customer",
  "manual",
]);

export const invoiceItemInputSchema = z.object({
  description: z.string().trim().min(1).max(500),
  detail: z.string().trim().max(2000).nullable().optional(),
  quantity: quantitySchema,
  unit: z.string().trim().min(1).max(40).default("unit"),
  unitPriceMinor: minorSchema,
  discountMinor: minorSchema.default(0),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const invoiceTotalsInputSchema = z.object({
  discountMinor: minorSchema.default(0),
  taxRateBps: z.number().int().nonnegative().default(0),
  taxMinor: minorSchema.optional(),
  additionalFeesMinor: minorSchema.default(0),
  amountPaidMinor: minorSchema.default(0),
});

const draftBaseSchema = z.object({
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("IDR"),
  issueDate: z.string().date().nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  paymentInstructions: z.string().trim().max(5000).nullable().optional(),
  terms: z.string().trim().max(5000).nullable().optional(),
  templateKey: invoiceTemplateKeySchema.default("calm-standard"),
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  items: z.array(invoiceItemInputSchema).min(1),
  totals: invoiceTotalsInputSchema.default({}),
});

const linkedCustomerDraftSchema = draftBaseSchema.extend({
  recipientSource: z.literal("linked_customer"),
  customerId: z.string().uuid(),
  bookingId: z.string().uuid().nullable().optional(),
});

const manualRecipientDraftSchema = draftBaseSchema.extend({
  recipientSource: z.literal("manual"),
  customerId: z.string().uuid().nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  manualRecipientName: z.string().trim().min(1, "recipient name is required").max(200),
  manualRecipientCompany: optionalTrimmed(200),
  manualRecipientPhone: optionalPhoneSchema,
  manualRecipientEmail: optionalEmailSchema,
  manualRecipientAddress: optionalTrimmed(1000),
  manualRecipientTaxId: optionalTrimmed(64),
});

export const createInvoiceDraftSchema = z
  .discriminatedUnion("recipientSource", [
    linkedCustomerDraftSchema,
    manualRecipientDraftSchema,
  ])
  .superRefine((value, ctx) => {
    if (value.recipientSource === "linked_customer") {
      return;
    }

    if (value.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manual recipient invoices cannot link a customer",
        path: ["customerId"],
      });
    }
    if (value.bookingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manual recipient invoices cannot attach a booking",
        path: ["bookingId"],
      });
    }
  });

export const updateInvoiceDraftSchema = z
  .discriminatedUnion("recipientSource", [
    linkedCustomerDraftSchema.extend({ invoiceId: z.string().uuid() }),
    manualRecipientDraftSchema.extend({ invoiceId: z.string().uuid() }),
  ])
  .superRefine((value, ctx) => {
    if (value.recipientSource === "linked_customer") {
      return;
    }

    if (value.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manual recipient invoices cannot link a customer",
        path: ["customerId"],
      });
    }
    if (value.bookingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manual recipient invoices cannot attach a booking",
        path: ["bookingId"],
      });
    }
  });

export const issueInvoiceSchema = z
  .object({
    invoiceId: z.string().uuid(),
  })
  .strict();

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  reason: z.string().trim().min(1, "void reason is required").max(1000),
});

export const markInvoiceSentSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const duplicateInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const invoicePrefixSchema = z
  .object({
    invoicePrefix: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((value) => {
        if (value == null || value === "") return null;
        return value;
      }),
  })
  .superRefine((value, ctx) => {
    if (value.invoicePrefix == null) return;
    const raw = value.invoicePrefix;
    if (/[^A-Za-z0-9]/.test(raw)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invoice prefix may only contain letters and numbers",
        path: ["invoicePrefix"],
      });
      return;
    }
    const normalized = raw.toUpperCase();
    if (normalized.length < 2 || normalized.length > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invoice prefix must be 2–10 characters",
        path: ["invoicePrefix"],
      });
    }
  })
  .transform((value) => ({
    invoicePrefix:
      value.invoicePrefix == null ? null : value.invoicePrefix.toUpperCase(),
  }));

export const invoiceBrandSettingsUpdateSchema = z.object({
  defaultTemplateKey: invoiceTemplateKeySchema.optional(),
  footerText: optionalTrimmed(2000),
  paymentAccountsJson: z
    .unknown()
    .optional()
    .superRefine((value, ctx) => {
      if (value === undefined) return;
      try {
        parsePaymentAccountsStrict(value);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            error instanceof Error
              ? error.message
              : "Payment accounts are invalid",
        });
      }
    })
    .transform((value) => {
      if (value === undefined) return undefined;
      return parsePaymentAccountsStrict(value);
    }),
  invoicePrefix: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => {
      if (value == null || value === "") return null;
      if (/[^A-Za-z0-9]/.test(value)) {
        throw new Error("Invoice prefix may only contain letters and numbers");
      }
      const normalized = value.toUpperCase();
      if (normalized.length < 2 || normalized.length > 10) {
        throw new Error("Invoice prefix must be 2–10 characters");
      }
      return normalized;
    }),
});

export const invoiceListFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  lifecycleStatus: invoiceLifecycleStatusSchema.optional(),
  paymentStatus: invoiceEffectivePaymentStatusSchema.optional(),
  customerId: z.string().uuid().optional(),
});

export type CreateInvoiceDraftInput = z.infer<typeof createInvoiceDraftSchema>;
export type UpdateInvoiceDraftInput = z.infer<typeof updateInvoiceDraftSchema>;
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>;
export type InvoiceListFilters = z.infer<typeof invoiceListFiltersSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type InvoiceRecipientSource = z.infer<typeof invoiceRecipientSourceSchema>;
export type InvoicePrefixInput = z.infer<typeof invoicePrefixSchema>;

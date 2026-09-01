import { z } from "zod";

import {
  createInvoiceDraftSchema,
  invoiceItemInputSchema,
} from "@/modules/finance/schemas/invoices";

export const proformaLifecycleStatusSchema = z.enum([
  "draft",
  "converted",
  "cancelled",
]);

export const createProformaDraftSchema = createInvoiceDraftSchema;

export const updateProformaDraftSchema = createInvoiceDraftSchema.and(
  z.object({ proformaId: z.string().uuid() }),
);

export const convertProformaSchema = z
  .object({
    proformaId: z.string().uuid(),
  })
  .strict();

export const cancelProformaSchema = z.object({
  proformaId: z.string().uuid(),
  reason: z.string().trim().min(1, "cancel reason is required").max(1000),
});

export const deleteDraftProformaSchema = z.object({
  proformaId: z.string().uuid(),
});

export const proformaListFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  lifecycleStatus: proformaLifecycleStatusSchema.optional(),
});

export { invoiceItemInputSchema };

export type CreateProformaDraftInput = z.infer<typeof createProformaDraftSchema>;
export type UpdateProformaDraftInput = z.infer<typeof updateProformaDraftSchema>;
export type ProformaListFilters = z.infer<typeof proformaListFiltersSchema>;

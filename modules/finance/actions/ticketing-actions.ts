"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { formatTicketingValidationError } from "@/modules/finance/lib/ticketing-validation-messages";
import {
  createTicketingDraftSchema,
  updateTicketingDraftSchema,
} from "@/modules/finance/schemas/ticketing";
import {
  createTicketingDraft,
  updateTicketingDraft,
} from "@/modules/finance/services/ticketing-service";
import type { InvoiceActionResult } from "@/modules/finance/actions/invoice-actions";

const INVOICES_PATH = "/finance/invoices";

export async function createTicketingDraftAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = createTicketingDraftSchema.parse(raw);
    const invoice = await createTicketingDraft(profile, input);
    revalidatePath(INVOICES_PATH);
    revalidatePath(`${INVOICES_PATH}/${invoice.id}`);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    // Detailed Zod issues stay server-side; browser gets a friendly message.
    console.error("[ticketing] create draft failed", error);
    return {
      success: false,
      message: formatTicketingValidationError(error),
    };
  }
}

export async function updateTicketingDraftAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = updateTicketingDraftSchema.parse(raw);
    const invoice = await updateTicketingDraft(profile, input);
    revalidatePath(INVOICES_PATH);
    revalidatePath(`${INVOICES_PATH}/${invoice.id}`);
    revalidatePath(`${INVOICES_PATH}/${invoice.id}/edit`);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    console.error("[ticketing] update draft failed", error);
    return {
      success: false,
      message: formatTicketingValidationError(error),
    };
  }
}

function parsePayload(formData: FormData): unknown {
  const raw = String(formData.get("payload_json") ?? "");
  return JSON.parse(raw);
}

export async function createTicketingDraftAndRedirectAction(formData: FormData) {
  let payload: unknown;
  try {
    payload = parsePayload(formData);
  } catch {
    redirect(
      `${INVOICES_PATH}/new?type=ticketing&error=${encodeURIComponent("Data tiket belum valid. Periksa kembali formulir.")}`,
    );
  }

  const result = await createTicketingDraftAction(payload);
  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/new?type=ticketing&error=${encodeURIComponent(result.message)}`,
    );
  }
  redirect(`${INVOICES_PATH}/${result.invoiceId}`);
}

export async function updateTicketingDraftAndRedirectAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  let payload: unknown;
  try {
    payload = parsePayload(formData);
  } catch {
    redirect(
      `${INVOICES_PATH}/${invoiceId}/edit?error=${encodeURIComponent("Data tiket belum valid. Periksa kembali formulir.")}`,
    );
  }

  const result = await updateTicketingDraftAction(payload);
  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}/edit?error=${encodeURIComponent(result.message)}`,
    );
  }
  redirect(`${INVOICES_PATH}/${result.invoiceId}`);
}

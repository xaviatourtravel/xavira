"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import {
  archiveInvoiceSchema,
  bulkRemoveInvoicesSchema,
  createInvoiceDraftSchema,
  deleteArchivedInvoiceSchema,
  deleteDraftInvoiceSchema,
  duplicateInvoiceSchema,
  invoiceBrandSettingsUpdateSchema,
  invoicePrefixSchema,
  issueInvoiceSchema,
  markInvoiceSentSchema,
  restoreInvoiceSchema,
  updateInvoiceDraftSchema,
  voidInvoiceSchema,
} from "@/modules/finance/schemas/invoices";
import {
  archiveIssuedInvoice,
  bulkRemoveInvoices,
  createDraftInvoice,
  deleteArchivedInvoice,
  deleteDraftInvoice,
  duplicateInvoiceAsDraft,
  issueDraftInvoice,
  loadInvoiceEditorOptions,
  markInvoiceSent,
  prefillFromBooking,
  restoreArchivedInvoice,
  saveOrganizationInvoiceBrandSettings,
  saveOrganizationInvoicePrefix,
  updateDraftInvoice,
  voidIssuedInvoice,
} from "@/modules/finance/services/invoice-service";

const INVOICES_PATH = "/finance/invoices";

function revalidateInvoices(invoiceId?: string) {
  revalidatePath(INVOICES_PATH);
  if (invoiceId) {
    revalidatePath(`${INVOICES_PATH}/${invoiceId}`);
    revalidatePath(`${INVOICES_PATH}/${invoiceId}/edit`);
  }
}

export type InvoiceActionResult =
  | { success: true; invoiceId: string; message?: string }
  | { success: false; message: string };

export async function createInvoiceDraftAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = createInvoiceDraftSchema.parse(raw);
    const invoice = await createDraftInvoice(profile, input);
    revalidateInvoices(invoice.id);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create draft",
    };
  }
}

export async function updateInvoiceDraftAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = updateInvoiceDraftSchema.parse(raw);
    const invoice = await updateDraftInvoice(profile, input);
    revalidateInvoices(invoice.id);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update draft",
    };
  }
}

export async function issueInvoiceAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = issueInvoiceSchema.parse(raw);
    const invoice = await issueDraftInvoice(profile, input);
    revalidateInvoices(invoice.id);
    return {
      success: true,
      invoiceId: invoice.id,
      message: invoice.invoiceNumber ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to issue invoice",
    };
  }
}

export async function voidInvoiceAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = voidInvoiceSchema.parse(raw);
    const invoice = await voidIssuedInvoice(profile, input);
    revalidateInvoices(invoice.id);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to void invoice",
    };
  }
}

export async function deleteDraftInvoiceAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = deleteDraftInvoiceSchema.parse(raw);
    const result = await deleteDraftInvoice(profile, input.invoiceId);
    revalidateInvoices(result.invoiceId);
    return { success: true, invoiceId: result.invoiceId };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete draft invoice",
    };
  }
}

export async function deleteArchivedInvoiceAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = deleteArchivedInvoiceSchema.parse(raw);
    const result = await deleteArchivedInvoice(profile, input.invoiceId);
    revalidateInvoices(result.invoiceId);
    return { success: true, invoiceId: result.invoiceId };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to permanently delete invoice",
    };
  }
}

export async function archiveInvoiceAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = archiveInvoiceSchema.parse(raw);
    const invoice = await archiveIssuedInvoice(profile, input);
    revalidateInvoices(invoice.id);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to archive invoice",
    };
  }
}

export async function restoreInvoiceAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = restoreInvoiceSchema.parse(raw);
    const invoice = await restoreArchivedInvoice(profile, input.invoiceId);
    revalidateInvoices(invoice.id);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to restore invoice",
    };
  }
}

export type BulkRemoveActionResult =
  | {
      success: true;
      deletedIds: string[];
      archivedIds: string[];
      restoredIds: string[];
      failed: Array<{ invoiceId: string; message: string }>;
    }
  | { success: false; message: string };

export async function bulkRemoveInvoicesAction(
  raw: unknown,
): Promise<BulkRemoveActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = bulkRemoveInvoicesSchema.parse(raw);
    const result = await bulkRemoveInvoices(profile, input);
    revalidateInvoices();
    for (const id of [
      ...result.deletedIds,
      ...result.archivedIds,
      ...result.restoredIds,
    ]) {
      revalidatePath(`${INVOICES_PATH}/${id}`);
    }
    return {
      success: true,
      deletedIds: result.deletedIds,
      archivedIds: result.archivedIds,
      restoredIds: result.restoredIds,
      failed: result.failed,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to remove invoices",
    };
  }
}

export async function markInvoiceSentAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = markInvoiceSentSchema.parse(raw);
    const invoice = await markInvoiceSent(profile, input.invoiceId);
    revalidateInvoices(invoice.id);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to mark sent",
    };
  }
}

export async function duplicateInvoiceAction(
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = duplicateInvoiceSchema.parse(raw);
    const invoice = await duplicateInvoiceAsDraft(profile, input.invoiceId);
    revalidateInvoices(invoice.id);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to duplicate invoice",
    };
  }
}

export async function loadBookingPrefillAction(bookingId: string) {
  const { profile } = await requireProfile();
  return prefillFromBooking(profile, bookingId);
}

export async function loadInvoiceEditorOptionsAction(customerId?: string | null) {
  const { profile } = await requireProfile();
  return loadInvoiceEditorOptions(profile, customerId);
}

export async function saveInvoicePrefixAction(
  raw: unknown,
): Promise<
  | { success: true; invoicePrefix: string | null }
  | { success: false; message: string }
> {
  try {
    const { profile } = await requireProfile();
    const input = invoicePrefixSchema.parse(raw);
    const invoicePrefix = await saveOrganizationInvoicePrefix(
      profile,
      input.invoicePrefix,
    );
    revalidateInvoices();
    return { success: true, invoicePrefix };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to save invoice prefix",
    };
  }
}

export async function saveInvoiceBrandSettingsAction(
  raw: unknown,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const { profile } = await requireProfile();
    const input = invoiceBrandSettingsUpdateSchema.parse(raw);
    await saveOrganizationInvoiceBrandSettings(profile, input);
    revalidateInvoices();
    revalidatePath("/finance/invoices/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save brand settings",
    };
  }
}

function parseDraftPayloadFromFormData(formData: FormData, items: unknown[]) {
  const recipientSource =
    String(formData.get("recipient_source") ?? "linked_customer") === "manual"
      ? "manual"
      : "linked_customer";
  const taxMinorRaw = formData.get("tax_minor");
  const totals = {
    discountMinor: Number(formData.get("discount_minor") ?? 0),
    taxRateBps: Number(formData.get("tax_rate_bps") ?? 0),
    taxMinor:
      taxMinorRaw === null || taxMinorRaw === ""
        ? undefined
        : Number(taxMinorRaw),
    additionalFeesMinor: Number(formData.get("additional_fees_minor") ?? 0),
    amountPaidMinor: Number(formData.get("amount_paid_minor") ?? 0),
  };
  const shared = {
    currency: String(formData.get("currency") ?? "IDR"),
    issueDate: formData.get("issue_date")
      ? String(formData.get("issue_date"))
      : null,
    dueDate: formData.get("due_date") ? String(formData.get("due_date")) : null,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
    paymentInstructions: formData.get("payment_instructions")
      ? String(formData.get("payment_instructions"))
      : null,
    terms: formData.get("terms") ? String(formData.get("terms")) : null,
    templateKey: String(formData.get("template_key") ?? "calm-standard"),
    primaryColor: formData.get("primary_color")
      ? String(formData.get("primary_color"))
      : undefined,
    secondaryColor: formData.get("secondary_color")
      ? String(formData.get("secondary_color"))
      : undefined,
    accentColor: formData.get("accent_color")
      ? String(formData.get("accent_color"))
      : undefined,
    items,
    totals,
  };

  if (recipientSource === "manual") {
    return {
      recipientSource: "manual" as const,
      customerId: null,
      bookingId: null,
      manualRecipientName: String(formData.get("manual_recipient_name") ?? ""),
      manualRecipientCompany: formData.get("manual_recipient_company")
        ? String(formData.get("manual_recipient_company"))
        : null,
      manualRecipientPhone: formData.get("manual_recipient_phone")
        ? String(formData.get("manual_recipient_phone"))
        : null,
      manualRecipientEmail: formData.get("manual_recipient_email")
        ? String(formData.get("manual_recipient_email"))
        : null,
      manualRecipientAddress: formData.get("manual_recipient_address")
        ? String(formData.get("manual_recipient_address"))
        : null,
      manualRecipientTaxId: formData.get("manual_recipient_tax_id")
        ? String(formData.get("manual_recipient_tax_id"))
        : null,
      ...shared,
    };
  }

  return {
    recipientSource: "linked_customer" as const,
    customerId: String(formData.get("customer_id") ?? ""),
    bookingId: formData.get("booking_id")
      ? String(formData.get("booking_id"))
      : null,
    ...shared,
  };
}

export async function createInvoiceDraftAndRedirectAction(formData: FormData) {
  const rawItems = String(formData.get("items_json") ?? "[]");
  let items: unknown[] = [];
  try {
    items = JSON.parse(rawItems) as unknown[];
  } catch {
    redirect(`${INVOICES_PATH}/new?error=${encodeURIComponent("Invalid line items")}`);
  }

  const result = await createInvoiceDraftAction(
    parseDraftPayloadFromFormData(formData, items),
  );

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/new?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}/${result.invoiceId}`);
}

export async function updateInvoiceDraftAndRedirectAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const rawItems = String(formData.get("items_json") ?? "[]");
  let items: unknown[] = [];
  try {
    items = JSON.parse(rawItems) as unknown[];
  } catch {
    redirect(
      `${INVOICES_PATH}/${invoiceId}/edit?error=${encodeURIComponent("Invalid line items")}`,
    );
  }

  const result = await updateInvoiceDraftAction({
    invoiceId,
    ...parseDraftPayloadFromFormData(formData, items),
  });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}/edit?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}/${result.invoiceId}`);
}

export async function issueInvoiceFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await issueInvoiceAction({
    invoiceId,
  });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}/${invoiceId}?issued=1`);
}

export async function voidInvoiceFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await voidInvoiceAction({
    invoiceId,
    reason: String(formData.get("reason") ?? ""),
  });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}/${invoiceId}`);
}

export async function duplicateInvoiceFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await duplicateInvoiceAction({ invoiceId });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}/${result.invoiceId}/edit`);
}

export async function markInvoiceSentFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await markInvoiceSentAction({ invoiceId });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}/${invoiceId}`);
}

export async function deleteDraftInvoiceFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await deleteDraftInvoiceAction({ invoiceId });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}?deleted=1`);
}

export async function deleteArchivedInvoiceFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await deleteArchivedInvoiceAction({ invoiceId });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}?archive=archived&deleted=1`);
}

export async function archiveInvoiceFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await archiveInvoiceAction({
    invoiceId,
    reason: String(formData.get("reason") ?? ""),
  });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}?archived=1`);
}

export async function restoreInvoiceFormAction(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const result = await restoreInvoiceAction({ invoiceId });

  if (!result.success) {
    redirect(
      `${INVOICES_PATH}/${invoiceId}?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(`${INVOICES_PATH}/${invoiceId}?restored=1`);
}

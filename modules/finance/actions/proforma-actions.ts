"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { parseDraftPayloadFromFormData } from "@/modules/finance/lib/parse-invoice-draft-form";
import {
  cancelProformaSchema,
  convertProformaSchema,
  createProformaDraftSchema,
  deleteDraftProformaSchema,
  updateProformaDraftSchema,
} from "@/modules/finance/schemas/proforma";
import {
  cancelProforma,
  convertProformaToInvoice,
  createDraftProforma,
  deleteDraftProforma,
  updateDraftProforma,
} from "@/modules/finance/services/proforma-service";

const PROFORMAS_PATH = "/finance/proformas";

function revalidateProformas(proformaId?: string, invoiceId?: string) {
  revalidatePath(PROFORMAS_PATH);
  revalidatePath("/finance/invoices");
  if (proformaId) {
    revalidatePath(`${PROFORMAS_PATH}/${proformaId}`);
    revalidatePath(`${PROFORMAS_PATH}/${proformaId}/edit`);
  }
  if (invoiceId) {
    revalidatePath(`/finance/invoices/${invoiceId}`);
  }
}

export type ProformaActionResult =
  | { success: true; proformaId: string; invoiceId?: string; message?: string }
  | { success: false; message: string };

function withZeroPaid(raw: ReturnType<typeof parseDraftPayloadFromFormData>) {
  return {
    ...raw,
    invoiceType: "package" as const,
    documentType: "invoice" as const,
    totals: {
      ...raw.totals,
      amountPaidMinor: 0,
    },
  };
}

export async function createProformaDraftAction(
  raw: unknown,
): Promise<ProformaActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = createProformaDraftSchema.parse(raw);
    const proforma = await createDraftProforma(profile, {
      ...input,
      invoiceType: "package",
      totals: { ...input.totals, amountPaidMinor: 0 },
    });
    revalidateProformas(proforma.id);
    return { success: true, proformaId: proforma.id };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create Proforma",
    };
  }
}

export async function updateProformaDraftAction(
  raw: unknown,
): Promise<ProformaActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = updateProformaDraftSchema.parse(raw);
    const proforma = await updateDraftProforma(profile, {
      ...input,
      invoiceType: "package",
      totals: { ...input.totals, amountPaidMinor: 0 },
    });
    revalidateProformas(proforma.id);
    return { success: true, proformaId: proforma.id };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update Proforma",
    };
  }
}

export async function convertProformaAction(
  raw: unknown,
): Promise<ProformaActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = convertProformaSchema.parse(raw);
    const result = await convertProformaToInvoice(profile, input.proformaId);
    revalidateProformas(result.proformaId, result.invoiceId);
    return {
      success: true,
      proformaId: result.proformaId,
      invoiceId: result.invoiceId,
      message: result.invoiceNumber ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to issue Invoice",
    };
  }
}

export async function cancelProformaAction(
  raw: unknown,
): Promise<ProformaActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = cancelProformaSchema.parse(raw);
    const proforma = await cancelProforma(profile, input);
    revalidateProformas(proforma.id);
    return { success: true, proformaId: proforma.id };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to cancel Proforma",
    };
  }
}

export async function deleteDraftProformaAction(
  raw: unknown,
): Promise<ProformaActionResult> {
  try {
    const { profile } = await requireProfile();
    const input = deleteDraftProformaSchema.parse(raw);
    await deleteDraftProforma(profile, input.proformaId);
    revalidateProformas();
    return { success: true, proformaId: input.proformaId };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete Proforma",
    };
  }
}

export async function createProformaDraftAndRedirectAction(formData: FormData) {
  const rawItems = String(formData.get("items_json") ?? "[]");
  let items: unknown[] = [];
  try {
    items = JSON.parse(rawItems) as unknown[];
  } catch {
    redirect(
      `${PROFORMAS_PATH}/new?error=${encodeURIComponent("Invalid line items")}`,
    );
  }

  const result = await createProformaDraftAction(
    withZeroPaid(parseDraftPayloadFromFormData(formData, items)),
  );
  if (!result.success) {
    redirect(`${PROFORMAS_PATH}/new?error=${encodeURIComponent(result.message)}`);
  }
  redirect(`${PROFORMAS_PATH}/${result.proformaId}`);
}

export async function updateProformaDraftAndRedirectAction(formData: FormData) {
  const proformaId = String(formData.get("proforma_id") ?? "");
  const rawItems = String(formData.get("items_json") ?? "[]");
  let items: unknown[] = [];
  try {
    items = JSON.parse(rawItems) as unknown[];
  } catch {
    redirect(
      `${PROFORMAS_PATH}/${proformaId}/edit?error=${encodeURIComponent("Invalid line items")}`,
    );
  }

  const result = await updateProformaDraftAction({
    proformaId,
    ...withZeroPaid(parseDraftPayloadFromFormData(formData, items)),
  });
  if (!result.success) {
    redirect(
      `${PROFORMAS_PATH}/${proformaId}/edit?error=${encodeURIComponent(result.message)}`,
    );
  }
  redirect(`${PROFORMAS_PATH}/${result.proformaId}`);
}

export async function convertProformaFormAction(formData: FormData) {
  const proformaId = String(formData.get("proforma_id") ?? "");
  const result = await convertProformaAction({ proformaId });
  if (!result.success) {
    redirect(
      `${PROFORMAS_PATH}/${proformaId}?error=${encodeURIComponent(result.message)}`,
    );
  }
  if (result.invoiceId) {
    redirect(`/finance/invoices/${result.invoiceId}?issued=1`);
  }
  redirect(`${PROFORMAS_PATH}/${proformaId}`);
}

export async function cancelProformaFormAction(formData: FormData) {
  const proformaId = String(formData.get("proforma_id") ?? "");
  const result = await cancelProformaAction({
    proformaId,
    reason: String(formData.get("reason") ?? ""),
  });
  if (!result.success) {
    redirect(
      `${PROFORMAS_PATH}/${proformaId}?error=${encodeURIComponent(result.message)}`,
    );
  }
  redirect(`${PROFORMAS_PATH}/${proformaId}`);
}

export async function deleteDraftProformaFormAction(formData: FormData) {
  const proformaId = String(formData.get("proforma_id") ?? "");
  const result = await deleteDraftProformaAction({ proformaId });
  if (!result.success) {
    redirect(
      `${PROFORMAS_PATH}/${proformaId}?error=${encodeURIComponent(result.message)}`,
    );
  }
  redirect(`${PROFORMAS_PATH}?deleted=1`);
}

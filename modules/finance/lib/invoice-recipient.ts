export type InvoiceRecipientSource = "linked_customer" | "manual";

/**
 * Shared display name for list/detail.
 * Priority: issued snapshot → linked customer → manual name → fallback.
 */
export function resolveRecipientDisplayName(input: {
  customerSnapshot?: Record<string, unknown> | null;
  customerName?: string | null;
  manualRecipientName?: string | null;
  fallback?: string;
}): string {
  const snapshotName =
    input.customerSnapshot &&
    typeof input.customerSnapshot.name === "string" &&
    input.customerSnapshot.name.trim()
      ? input.customerSnapshot.name.trim()
      : null;

  if (snapshotName) return snapshotName;

  const linked = input.customerName?.trim();
  if (linked) return linked;

  const manual = input.manualRecipientName?.trim();
  if (manual) return manual;

  return input.fallback ?? "Penerima belum diisi";
}

export function emptyManualRecipientFields() {
  return {
    manualRecipientName: null as string | null,
    manualRecipientCompany: null as string | null,
    manualRecipientPhone: null as string | null,
    manualRecipientEmail: null as string | null,
    manualRecipientAddress: null as string | null,
    manualRecipientTaxId: null as string | null,
  };
}

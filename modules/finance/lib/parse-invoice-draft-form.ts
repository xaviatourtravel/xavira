export function parseDraftPayloadFromFormData(formData: FormData, items: unknown[]) {
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

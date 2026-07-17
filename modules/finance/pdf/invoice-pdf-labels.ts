/**
 * Customer-facing Indonesian labels for invoice PDFs.
 * Never expose raw lifecycle/payment enum values in documents.
 */

export const INVOICE_PDF_LABELS = {
  billTo: "Ditagihkan kepada",
  invoice: "Invoice",
  number: "Nomor invoice",
  issueDate: "Tanggal terbit",
  dueDate: "Jatuh tempo",
  status: "Status invoice",
  payment: "Status pembayaran",
  description: "Deskripsi",
  qty: "Qty",
  unit: "Satuan",
  price: "Harga satuan",
  discount: "Diskon",
  lineAmount: "Jumlah",
  subtotal: "Subtotal",
  tax: "Pajak",
  additionalFees: "Biaya tambahan",
  total: "Total invoice",
  amountPaid: "Sudah dibayar",
  balanceDue: "Sisa pembayaran",
  notes: "Catatan",
  terms: "Syarat dan ketentuan",
  paymentInformation: "Informasi pembayaran",
  booking: "Booking",
  draftWatermark: "DRAFT",
  accountHolderPrefix: "a/n",
  bankLabel: "Bank",
  accountNumberLabel: "Nomor rekening",
  accountHolderLabel: "Atas nama",
  branchLabel: "Cabang",
  swiftLabel: "SWIFT",
  notesLabel: "Catatan",
  bankCode: "Kode bank",
  thankYou: "Terima kasih atas kepercayaan Anda.",
  page: "Halaman",
  travelSubtitle: "Invoice perjalanan",
  boutiqueSubtitle: "Invoice layanan",
} as const;

const LIFECYCLE_LABELS: Record<string, string> = {
  draft: "Draft",
  issued: "Terbit",
  sent: "Terkirim",
  void: "Dibatalkan",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Belum dibayar",
  partially_paid: "Dibayar sebagian",
  paid: "Lunas",
  overdue: "Terlambat",
};

/** Labels that must never appear as English skeleton copy in PDFs. */
export const FORBIDDEN_ENGLISH_PDF_LABELS = [
  "Bill to",
  "Issue date",
  "Due date",
  "Amount paid",
  "Balance due",
  "Payment information",
  "Additional fees",
  "Terms",
] as const;

export function formatInvoicePdfLifecycleStatus(status: string): string {
  return LIFECYCLE_LABELS[status] ?? "Terbit";
}

export function formatInvoicePdfPaymentStatus(status: string): string {
  return PAYMENT_LABELS[status] ?? "Belum dibayar";
}

/** High-contrast initials: 2–3 characters from company name words. */
export function companyInitialsForPdf(name: string): string {
  const parts = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "IN";
  if (parts.length === 1) return parts[0]!.slice(0, 3);
  if (parts.length === 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.slice(0, 2);
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}${parts[2]![0] ?? ""}`.slice(
    0,
    3,
  );
}

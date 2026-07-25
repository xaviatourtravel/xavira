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
  ticketSummary: "Ringkasan tiket",
  pnr: "Kode booking (PNR)",
  passengers: "Jumlah penumpang",
  tripType: "Jenis perjalanan",
  primaryAirline: "Maskapai utama",
  flightItinerary: "Rincian penerbangan",
  departureGroup: "Keberangkatan",
  returnGroup: "Kepulangan",
  otherGroup: "Rute lainnya",
  transit: "Transit",
  nextDay: "hari",
  flightClass: "Kelas",
  passengersUnit: "penumpang",
  // FIN-002G Desklabs ticketing billing document
  invoiceTicketTitle: "INVOICE TIKET PESAWAT",
  proformaTicketTitle: "PROFORMA INVOICE TIKET PESAWAT",
  billTime: "Waktu tagihan",
  dueTime: "Waktu jatuh tempo",
  paymentStatusMeta: "Status pembayaran",
  billToHeading: "Ditagihkan kepada",
  currentPaymentRequest: "Permintaan pembayaran saat ini",
  paymentCode: "Kode",
  bookingPnrCode: "Kode Booking PNR",
  billItemName: "Item Tagihan",
  amountDueNow: "Jumlah yang Harus Dibayar",
  paymentExpires: "Jatuh Tempo",
  paymentNote: "Keterangan",
  transactionDetails: "Rincian transaksi",
  billItem: "Item Tagihan",
  billAmount: "Jumlah tagihan",
  transactionSummary: "Ringkasan transaksi",
  financialSummary: "Ringkasan keuangan",
  totalBill: "Total tagihan",
  paymentsReceived: "Pembayaran diterima",
  amountOutstanding: "Kekurangan pembayaran",
  paymentHistory: "Riwayat pembayaran",
  paymentDate: "Waktu pembayaran",
  paymentMethod: "Metode",
  paymentStatusCol: "Status",
  paymentHistoryNote: "Catatan",
  paymentAccountDetails: "Informasi pembayaran",
  paymentAccountIntro:
    "Untuk pembayaran melalui transfer dapat ditujukan ke:",
  pnrUnavailable: "Tidak tersedia",
  dueDateUnset: "Tidak ditentukan",
} as const;

const TRIP_TYPE_LABELS: Record<string, string> = {
  one_way: "Sekali jalan",
  round_trip: "Pulang pergi",
  multi_city: "Multi kota",
};

export function formatTripType(tripType: string): string {
  return TRIP_TYPE_LABELS[tripType] ?? tripType;
}

/** Customer-facing document title by invoice + document type. */
export function invoiceDocumentTitle(
  invoiceType: "package" | "ticketing",
  documentType: "invoice" | "proforma",
): string {
  if (invoiceType === "ticketing") {
    return documentType === "proforma"
      ? INVOICE_PDF_LABELS.proformaTicketTitle
      : INVOICE_PDF_LABELS.invoiceTicketTitle;
  }
  return documentType === "proforma" ? "Proforma Invoice" : "Invoice";
}

const PAYMENT_HISTORY_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  successful: "Sukses",
  failed: "Gagal",
  reversed: "Dikembalikan",
};

export function formatInvoicePaymentHistoryStatus(status: string): string {
  return PAYMENT_HISTORY_STATUS_LABELS[status] ?? status;
}

const LIFECYCLE_LABELS: Record<string, string> = {
  draft: "Draft",
  issued: "Terbit",
  sent: "Terkirim",
  void: "Dibatalkan",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Menunggu pembayaran",
  partially_paid: "Dibayar sebagian",
  paid: "Lunas",
  overdue: "Terlambat",
  void: "Dibatalkan",
  cancelled: "Dibatalkan",
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
  return PAYMENT_LABELS[status] ?? "Menunggu pembayaran";
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

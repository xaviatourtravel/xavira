/**
 * Deterministic InvoiceRecord fixtures for PDF visual/structural regression.
 * Presentation-only — does not mutate domain or snapshots.
 */

import type { InvoiceRecord } from "@/modules/finance/types/invoices";

const ORG = "22222222-2222-2222-2222-222222222222";
const INV = "11111111-1111-1111-1111-111111111111";
const ITEM = "33333333-3333-3333-3333-333333333333";

const companyBase = {
  legalName: "PT Xavia Mulya Semesta",
  logoUrl: null as string | null,
  address: "Jl. Senopati No. 12, Jakarta Selatan 12190",
  email: "finance@xavia.example",
  phone: "+62 21 1234 5678",
  website: "https://xavia.example",
  taxId: "10.0.0.0-000.000",
  paymentAccounts: [
    {
      id: "pay-bca",
      bankName: "BCA",
      accountNumber: "1234567890",
      accountHolder: "PT Xavia Mulya Semesta",
      branch: "KCP Senopati",
      swiftCode: "CENAIDJA",
      notes: null as string | null,
      enabled: true,
      isDefault: true,
      sortOrder: 0,
    },
  ],
  primaryColor: "#0F172A",
  secondaryColor: "#64748B",
  accentColor: "#0F766E",
  footerText: "Terima kasih atas kepercayaan Anda.",
  tagline: "Travel & hospitality operations",
} as const;

function base(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  return {
    id: INV,
    organizationId: ORG,
    recipientSource: "manual",
    customerId: null,
    bookingId: null,
    manualRecipientName: "Budi Santoso",
    manualRecipientCompany: null,
    manualRecipientPhone: "+628121234567",
    manualRecipientEmail: "budi@example.com",
    manualRecipientAddress: "Jakarta",
    manualRecipientTaxId: null,
    invoiceNumber: "INV/XAVIA/2026/0010",
    lifecycleStatus: "issued",
    paymentStatus: "unpaid",
    effectivePaymentStatus: "unpaid",
    currency: "IDR",
    issueDate: "2026-07-14",
    dueDate: "2026-07-28",
    subtotalMinor: 2_000_000,
    discountMinor: 0,
    taxMinor: 0,
    taxRateBps: 0,
    additionalFeesMinor: 0,
    totalMinor: 2_000_000,
    amountPaidMinor: 0,
    balanceDueMinor: 2_000_000,
    templateKey: "corporate",
    templateVersion: 2,
    themeSnapshot: {
      templateKey: "corporate",
      templateVersion: 2,
      primaryColor: "#0F172A",
      secondaryColor: "#64748B",
      accentColor: "#0F766E",
    },
    companySnapshot: { ...companyBase } as InvoiceRecord["companySnapshot"],
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Budi Santoso",
      company: null,
      phone: "+628121234567",
      email: "budi@example.com",
      address: "Jakarta",
      tax_id: null,
    },
    bookingSnapshot: null,
    notes: null,
    paymentInstructions: null,
    terms: null,
    pdfStoragePath: null,
    pdfStatus: "ready",
    pdfGeneratedAt: null,
    pdfErrorCode: null,
    logoAssetPath: null,
    logoContentHash: null,
    issuedAt: "2026-07-14T01:00:00.000Z",
    sentAt: null,
    voidedAt: null,
    voidReason: null,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
    items: [
      {
        id: ITEM,
        invoiceId: INV,
        description: "Paket Umroh Reguler",
        detail: null,
        quantity: 2,
        unit: "pax",
        unitPriceMinor: 1_000_000,
        discountMinor: 0,
        lineTotalMinor: 2_000_000,
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

/** 1 item, 1 payment account, no notes, no due date — short composition. */
export function fixtureShortInvoice(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return base({
    dueDate: null,
    notes: null,
    terms: null,
    paymentInstructions: null,
    items: [
      {
        id: ITEM,
        invoiceId: INV,
        description: "Konsultasi",
        detail: null,
        quantity: 1,
        unit: "sesi",
        unitPriceMinor: 500_000,
        discountMinor: 0,
        lineTotalMinor: 500_000,
        sortOrder: 0,
      },
    ],
    subtotalMinor: 500_000,
    totalMinor: 500_000,
    balanceDueMinor: 500_000,
    ...overrides,
  });
}

/** Typical multi-field invoice. */
export function fixtureStandardInvoice(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return base({
    notes: "Mohon transfer sesuai nominal.",
    paymentInstructions: "Cantumkan nomor invoice pada berita transfer.",
    ...overrides,
  });
}

/** B2B recipient with company + tax ID. */
export function fixtureB2bInvoice(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return base({
    manualRecipientName: "Andi Wijaya",
    manualRecipientCompany: "PT Mitra Niaga Sejahtera",
    manualRecipientAddress:
      "Gedung Menara Astra Lantai 12, Jl. Jend. Sudirman Kav. 5–6, Jakarta Pusat 10220",
    manualRecipientTaxId: "01.234.567.8-901.000",
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Andi Wijaya",
      company: "PT Mitra Niaga Sejahtera",
      phone: "+62811999888",
      email: "andi@mitraniaga.example",
      address:
        "Gedung Menara Astra Lantai 12, Jl. Jend. Sudirman Kav. 5–6, Jakarta Pusat 10220",
      tax_id: "01.234.567.8-901.000",
    },
    discountMinor: 100_000,
    taxMinor: 190_000,
    taxRateBps: 1100,
    subtotalMinor: 2_000_000,
    totalMinor: 2_090_000,
    balanceDueMinor: 2_090_000,
    ...overrides,
  });
}

/** 50 items, long text, multiple payment accounts — multipage stress. */
export function fixtureLongInvoice(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  const items = Array.from({ length: 50 }, (_, index) => ({
    id: `33333333-3333-3333-3333-${String(index).padStart(12, "0")}`,
    invoiceId: INV,
    description: `Layanan operasional ${index + 1} — deskripsi panjang untuk menguji wrap dan header ulang pada halaman berikutnya tanpa truncasi teks penting`,
    detail:
      "Detail tambahan yang cukup panjang agar baris tidak terpotong secara tidak sengaja saat layout multipage.",
    quantity: 1,
    unit: "unit",
    unitPriceMinor: 100_000,
    discountMinor: 0,
    lineTotalMinor: 100_000,
    sortOrder: index,
  }));

  return base({
    notes:
      "Catatan panjang: ".repeat(40) +
      "Pastikan seluruh catatan tetap terbaca di halaman akhir tanpa truncasi.",
    terms:
      "Syarat panjang: ".repeat(30) +
      "Pembayaran dianggap sah setelah dana masuk rekening resmi perusahaan.",
    paymentInstructions: "Gunakan salah satu rekening di bawah.",
    companySnapshot: {
      ...companyBase,
      paymentAccounts: [
        ...companyBase.paymentAccounts,
        {
          id: "pay-mandiri",
          bankName: "Bank Mandiri",
          accountNumber: "9876543210",
          accountHolder: "PT Xavia Mulya Semesta",
          branch: "KC Thamrin",
          swiftCode: "BMRIIDJA",
          notes: null,
          enabled: true,
          isDefault: false,
          sortOrder: 1,
        },
        {
          id: "pay-bni",
          bankName: "BNI",
          accountNumber: "1122334455",
          accountHolder: "PT Xavia Mulya Semesta",
          branch: null,
          swiftCode: null,
          notes: "Khusus transfer domestik",
          enabled: true,
          isDefault: false,
          sortOrder: 2,
        },
      ],
    } as InvoiceRecord["companySnapshot"],
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Siti Rahayu",
      company: "CV Nusantara Jaya Abadi Sejahtera",
      phone: "+628170001122",
      email: "siti@nusantara.example",
      address:
        "Komplek Perkantoran Green Office Park Blok C No. 18, BSD City, Tangerang Selatan, Banten 15345, Indonesia",
      tax_id: "02.345.678.9-012.000",
    },
    items,
    subtotalMinor: 5_000_000,
    totalMinor: 5_000_000,
    balanceDueMinor: 5_000_000,
    ...overrides,
  });
}

export function fixturePaidInvoice(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return base({
    paymentStatus: "paid",
    effectivePaymentStatus: "paid",
    amountPaidMinor: 2_000_000,
    balanceDueMinor: 0,
    ...overrides,
  });
}

export function fixtureOverdueInvoice(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return base({
    paymentStatus: "unpaid",
    effectivePaymentStatus: "overdue",
    dueDate: "2026-06-01",
    ...overrides,
  });
}

export function fixtureManualRecipient(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return fixtureShortInvoice({
    recipientSource: "manual",
    customerId: null,
    manualRecipientName: "Rina Manual",
    manualRecipientCompany: null,
    manualRecipientEmail: null,
    manualRecipientPhone: null,
    manualRecipientAddress: null,
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Rina Manual",
      company: null,
      phone: null,
      email: null,
      address: null,
      tax_id: null,
    },
    ...overrides,
  });
}

export function fixtureLinkedCustomerBooking(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return base({
    recipientSource: "linked_customer",
    customerId: "44444444-4444-4444-4444-444444444444",
    bookingId: "55555555-5555-5555-5555-555555555555",
    bookingCode: "BK-2026-0042",
    customerSnapshot: {
      source: "linked_customer",
      customer_id: "44444444-4444-4444-4444-444444444444",
      name: "Farah Linked",
      company: null,
      phone: "+62813111222",
      email: "farah@example.com",
      address: "Bandung",
      tax_id: null,
    },
    bookingSnapshot: {
      bookingId: "55555555-5555-5555-5555-555555555555",
      bookingCode: "BK-2026-0042",
      packageName: "Umroh Plus Turki 12 Hari",
      departureDate: "2026-09-10",
      participantCount: 3,
      leadTraveller: "Farah Linked",
      totalAmountMinor: 45_000_000,
    },
    ...overrides,
  });
}

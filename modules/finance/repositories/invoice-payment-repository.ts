import type {
  InvoicePaymentRecord,
  InvoicePaymentStatus,
} from "@/modules/finance/types/invoice-payments";
import { createClient } from "@/lib/supabase/server";

type InvoicePaymentRow = {
  id: string;
  organization_id: string;
  invoice_id: string;
  payment_code: string;
  amount_minor: number;
  paid_at: string;
  payment_method: string | null;
  bank_name: string | null;
  account_number_masked: string | null;
  status: InvoicePaymentStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function mapPayment(row: InvoicePaymentRow): InvoicePaymentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    invoiceId: row.invoice_id,
    paymentCode: row.payment_code,
    amountMinor: row.amount_minor,
    paidAt: row.paid_at,
    paymentMethod: row.payment_method,
    bankName: row.bank_name,
    accountNumberMasked: row.account_number_masked,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** List payments for an invoice, newest first. Organization-scoped. */
export async function listInvoicePayments(
  organizationId: string,
  invoiceId: string,
): Promise<InvoicePaymentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_payments")
    .select(
      "id, organization_id, invoice_id, payment_code, amount_minor, paid_at, payment_method, bank_name, account_number_masked, status, note, created_at, updated_at",
    )
    .eq("organization_id", organizationId)
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list invoice payments: ${error.message}`);
  }

  return ((data ?? []) as InvoicePaymentRow[]).map(mapPayment);
}

export type RecordInvoicePaymentInput = {
  invoiceId: string;
  paymentCode: string;
  amountMinor: number;
  paidAt?: string | null;
  paymentMethod?: string | null;
  bankName?: string | null;
  accountNumberMasked?: string | null;
  status?: InvoicePaymentStatus;
  note?: string | null;
};

/** Trusted RPC — inserts payment and recomputes aggregates in one transaction. */
export async function rpcRecordInvoicePayment(
  input: RecordInvoicePaymentInput,
): Promise<InvoicePaymentRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "record_invoice_payment" as never,
    {
      p_invoice_id: input.invoiceId,
      p_payment_code: input.paymentCode,
      p_amount_minor: input.amountMinor,
      p_paid_at: input.paidAt ?? null,
      p_payment_method: input.paymentMethod ?? null,
      p_bank_name: input.bankName ?? null,
      p_account_number_masked: input.accountNumberMasked ?? null,
      p_status: input.status ?? "successful",
      p_note: input.note ?? null,
    } as never,
  );

  if (error) {
    throw new Error(`Failed to record invoice payment: ${error.message}`);
  }

  const row = data as InvoicePaymentRow;
  return mapPayment(row);
}

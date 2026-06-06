import {
  createBookingPayment,
} from "@/app/(dashboard)/bookings/[id]/actions";
import {
  BookingPaymentsList,
  type BookingPaymentItem,
} from "@/components/bookings/booking-payments-list";

export type { BookingPaymentItem };

type BookingPaymentsSectionProps = {
  bookingId: string;
  payments: BookingPaymentItem[];
};

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type BookingPaymentSummaryProps = {
  bookingTotalAmount: number;
  payments: BookingPaymentItem[];
};

export function BookingPaymentSummary({
  bookingTotalAmount,
  payments,
}: BookingPaymentSummaryProps) {
  const totalPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const outstandingBalance = Number(bookingTotalAmount) - totalPayments;

  return (
    <div className="rounded-lg border p-6">
      <div>
        <h2 className="text-lg font-semibold">Payment Summary</h2>
        <p className="text-sm text-muted-foreground">
          Ringkasan pembayaran booking ini.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-lg font-semibold">
            {formatCurrency(Number(bookingTotalAmount))}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Payments</p>
          <p className="text-lg font-semibold">
            {formatCurrency(totalPayments)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Outstanding Balance</p>
          <p className="text-lg font-semibold">
            {formatCurrency(outstandingBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function BookingPaymentsSection({
  bookingId,
  payments,
}: BookingPaymentsSectionProps) {
  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div>
        <h2 className="text-lg font-semibold">Payments</h2>
        <p className="text-sm text-muted-foreground">
          Riwayat pembayaran untuk booking ini.
        </p>
      </div>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Add Payment
        </summary>

        <form action={createBookingPayment} className="mt-4 space-y-4">
          <input type="hidden" name="booking_id" value={bookingId} />

          <div>
            <label className="text-sm font-medium">Payment Type</label>
            <select
              name="payment_type"
              required
              defaultValue="dp"
              className={inputClassName}
            >
              <option value="dp">DP</option>
              <option value="installment">Installment</option>
              <option value="final">Final</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Amount</label>
            <input
              name="amount"
              type="number"
              min={0}
              required
              className={inputClassName}
              placeholder="Contoh: 5000000"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Payment Date</label>
            <input
              name="payment_date"
              type="date"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className={inputClassName}
              placeholder="Catatan pembayaran"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Simpan Payment
          </button>
        </form>
      </details>

      <BookingPaymentsList bookingId={bookingId} payments={payments} />
    </div>
  );
}

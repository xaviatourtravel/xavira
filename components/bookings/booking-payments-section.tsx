import {
  createBookingPayment,
} from "@/app/(dashboard)/bookings/[id]/actions";
import {
  BookingPaymentsList,
  type BookingPaymentItem,
} from "@/components/bookings/booking-payments-list";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import {
  BOOKING_PAYMENT_METHODS,
  BOOKING_PAYMENT_TYPES,
} from "@/lib/bookings/payment-fields";
import {
  calculateBookingPaymentStatus,
} from "@/lib/bookings/payment-status";
import { buildBookingPaymentTotals } from "@/lib/bookings/payment-summary";

export type { BookingPaymentItem };

type BookingPaymentsSectionProps = {
  bookingId: string;
  payments: BookingPaymentItem[];
  canCreatePayment?: boolean;
};

const inputClassName =
  "mt-1 min-h-[44px] w-full rounded-md border px-3 py-2 text-sm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type BookingPaymentSummaryProps = {
  bookingTotalAmount: number;
  paymentStatus: string;
  payments: BookingPaymentItem[];
};

export function BookingPaymentSummary({
  bookingTotalAmount,
  paymentStatus,
  payments,
}: BookingPaymentSummaryProps) {
  const { amountPaid, dpAmount, outstandingBalance } = buildBookingPaymentTotals(
    bookingTotalAmount,
    payments,
  );
  const computedStatus = calculateBookingPaymentStatus(
    bookingTotalAmount,
    amountPaid,
  );

  return (
    <div className="rounded-lg border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Payment Summary</h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan pembayaran booking ini.
          </p>
        </div>
        <PaymentStatusBadge status={paymentStatus || computedStatus} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Price</p>
          <p className="text-lg font-semibold">
            {formatCurrency(Number(bookingTotalAmount))}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">DP Amount</p>
          <p className="text-lg font-semibold">{formatCurrency(dpAmount)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Amount Paid</p>
          <p className="text-lg font-semibold">{formatCurrency(amountPaid)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Outstanding Balance</p>
          <p className="text-lg font-semibold">
            {formatCurrency(outstandingBalance)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Payment Status</p>
          <div className="mt-1">
            <PaymentStatusBadge status={paymentStatus || computedStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingPaymentsSection({
  bookingId,
  payments,
  canCreatePayment = true,
}: BookingPaymentsSectionProps) {
  return (
    <div className="space-y-6 rounded-lg border p-4 md:p-6">
      <div>
        <h2 className="text-lg font-semibold">Payments</h2>
        <p className="text-sm text-muted-foreground">
          Riwayat pembayaran untuk booking ini.
        </p>
      </div>

      {canCreatePayment ? (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Add Payment
          </summary>

        <form action={createBookingPayment} className="mt-4 space-y-4">
          <input type="hidden" name="booking_id" value={bookingId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Payment Date</label>
              <input
                name="payment_date"
                type="date"
                className={inputClassName}
              />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <select
                name="payment_method"
                defaultValue="bank_transfer"
                className={inputClassName}
              >
                {BOOKING_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === "bank_transfer"
                      ? "Bank Transfer"
                      : method === "credit_card"
                        ? "Credit Card"
                        : method.charAt(0).toUpperCase() + method.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Type</label>
              <select
                name="payment_type"
                required
                defaultValue="down_payment"
                className={inputClassName}
              >
                {BOOKING_PAYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === "down_payment"
                      ? "Down Payment"
                      : type === "final_payment"
                        ? "Final Payment"
                        : "Installment"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Reference Number</label>
            <input
              name="reference_number"
              type="text"
              className={inputClassName}
              placeholder="No. transfer / invoice"
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
            className="min-h-[44px] w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white sm:w-auto"
          >
            Add Payment
          </button>
        </form>
      </details>
      ) : (
        <p className="text-sm text-muted-foreground">
          You do not have permission to record payments.
        </p>
      )}

      <BookingPaymentsList
        bookingId={bookingId}
        payments={payments}
        canManagePayments={canCreatePayment}
      />
    </div>
  );
}

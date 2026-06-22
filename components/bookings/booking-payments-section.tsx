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
import { resolveBookingSubtotal } from "@/lib/bookings/discount";
import { buildBookingPaymentTotals } from "@/lib/bookings/payment-summary";
import { cn } from "@/lib/utils";

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

function getOutstandingValueClass(balance: number) {
  if (balance === 0) {
    return "text-emerald-700";
  }

  return "text-orange-600";
}

function PaymentSummaryRow({
  label,
  value,
  valueClassName,
  emphasized = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        emphasized && "border-t bg-muted/20 px-1 -mx-1",
      )}
    >
      <span
        className={cn(
          "text-sm text-muted-foreground",
          emphasized && "font-medium text-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap tabular-nums text-sm font-semibold sm:text-base",
          emphasized && "text-base font-bold sm:text-lg",
          valueClassName ?? "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

type BookingPaymentSummaryProps = {
  subtotalAmount: number;
  discountAmount: number;
  bookingTotalAmount: number;
  paymentStatus: string;
  payments: BookingPaymentItem[];
};

export function BookingPaymentSummary({
  subtotalAmount,
  discountAmount,
  bookingTotalAmount,
  paymentStatus,
  payments,
}: BookingPaymentSummaryProps) {
  const { amountPaid, outstandingBalance } = buildBookingPaymentTotals(
    bookingTotalAmount,
    payments,
  );
  const computedStatus = calculateBookingPaymentStatus(
    bookingTotalAmount,
    amountPaid,
  );
  const resolvedStatus = paymentStatus || computedStatus;
  const normalizedDiscount = Math.min(
    Math.max(0, Number(discountAmount)),
    Number(subtotalAmount),
  );

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-3 border-b pb-4">
        <h2 className="text-lg font-semibold">Payment Summary</h2>
        <PaymentStatusBadge status={resolvedStatus} />
      </div>

      <div className="divide-y">
        <PaymentSummaryRow
          label="Subtotal"
          value={formatCurrency(Number(subtotalAmount))}
        />
        <PaymentSummaryRow
          label="Discount"
          value={
            normalizedDiscount > 0
              ? `- ${formatCurrency(normalizedDiscount)}`
              : formatCurrency(0)
          }
          valueClassName={
            normalizedDiscount > 0 ? "text-red-600" : "text-foreground"
          }
        />
        <PaymentSummaryRow
          label="Final Total"
          value={formatCurrency(Number(bookingTotalAmount))}
        />
        <PaymentSummaryRow
          label="Amount Paid"
          value={formatCurrency(amountPaid)}
        />
        <PaymentSummaryRow
          label="Outstanding Balance"
          value={formatCurrency(outstandingBalance)}
          valueClassName={getOutstandingValueClass(outstandingBalance)}
          emphasized
        />
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

export function buildBookingPaymentSummaryProps(booking: {
  subtotal_amount: number | null;
  discount_amount: number | null;
  total_amount: number;
}) {
  const subtotalAmount = resolveBookingSubtotal(
    booking.subtotal_amount,
    booking.total_amount,
    booking.discount_amount,
  );
  const discountAmount = Number(booking.discount_amount ?? 0);
  const bookingTotalAmount = Number(booking.total_amount);

  return {
    subtotalAmount,
    discountAmount,
    bookingTotalAmount,
  };
}

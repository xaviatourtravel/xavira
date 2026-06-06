import {
  createBookingPayment,
  deleteBookingPayment,
} from "@/app/(dashboard)/bookings/[id]/actions";

export type BookingPaymentItem = {
  id: string;
  payment_type: string;
  amount: number;
  payment_date: string | null;
  notes: string | null;
};

type BookingPaymentsSectionProps = {
  bookingId: string;
  bookingTotalAmount: number;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatPaymentType(value: string) {
  const labels: Record<string, string> = {
    dp: "DP",
    installment: "Installment",
    final: "Final",
  };

  return labels[value] ?? value;
}

export function BookingPaymentsSection({
  bookingId,
  bookingTotalAmount,
  payments,
}: BookingPaymentsSectionProps) {
  const totalPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const outstandingBalance = Number(bookingTotalAmount) - totalPayments;

  return (
    <div className="rounded-lg border p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Payments</h2>
        <p className="text-sm text-muted-foreground">
          Riwayat pembayaran untuk booking ini.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada payment untuk booking ini.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Payment Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Payment Date</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    {formatPaymentType(payment.payment_type)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatCurrency(Number(payment.amount))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {payment.payment_date
                      ? formatDate(payment.payment_date)
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{payment.notes || "-"}</td>
                  <td className="px-4 py-3">
                    <form action={deleteBookingPayment}>
                      <input
                        type="hidden"
                        name="booking_id"
                        value={bookingId}
                      />
                      <input
                        type="hidden"
                        name="payment_id"
                        value={payment.id}
                      />
                      <button
                        type="submit"
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                      >
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

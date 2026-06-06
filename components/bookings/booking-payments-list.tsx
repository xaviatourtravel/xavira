"use client";

import { useState } from "react";

import {
  deleteBookingPayment,
  updateBookingPayment,
} from "@/app/(dashboard)/bookings/[id]/actions";

export type BookingPaymentItem = {
  id: string;
  payment_type: string;
  amount: number;
  payment_date: string | null;
  notes: string | null;
};

type BookingPaymentsListProps = {
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

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function BookingPaymentsList({
  bookingId,
  payments,
}: BookingPaymentsListProps) {
  const [editingPayment, setEditingPayment] =
    useState<BookingPaymentItem | null>(null);

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada payment untuk booking ini.
      </p>
    );
  }

  return (
    <>
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPayment(payment)}
                      className="rounded border border-blue-600 px-2 py-1 text-xs text-blue-600"
                    >
                      Edit
                    </button>
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
                        className="rounded border border-red-600 px-2 py-1 text-xs text-red-600"
                      >
                        Hapus
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Tutup modal"
            onClick={() => setEditingPayment(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Edit Payment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Perbarui data pembayaran booking.
            </p>

            <form action={updateBookingPayment} className="mt-4 space-y-4">
              <input type="hidden" name="booking_id" value={bookingId} />
              <input
                type="hidden"
                name="payment_id"
                value={editingPayment.id}
              />

              <div>
                <label className="text-sm font-medium">Payment Type</label>
                <select
                  name="payment_type"
                  required
                  defaultValue={editingPayment.payment_type}
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
                  defaultValue={Number(editingPayment.amount)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Payment Date</label>
                <input
                  name="payment_date"
                  type="date"
                  defaultValue={toDateInputValue(editingPayment.payment_date)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingPayment.notes ?? ""}
                  className={inputClassName}
                  placeholder="Catatan pembayaran"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

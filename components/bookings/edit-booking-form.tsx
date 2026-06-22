"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { updateBooking } from "@/app/(dashboard)/bookings/[id]/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  calculateBookingFinalTotal,
  resolveBookingSubtotal,
} from "@/lib/bookings/discount";
import { calculateBookingTotalAmount } from "@/lib/bookings/total-amount";
import { cn } from "@/lib/utils";

type PackagePrice = {
  name: string;
  price_idr: number | null;
};

type EditBookingFormProps = {
  booking: {
    id: string;
    package_name: string | null;
    departure_date: string | null;
    total_pax: number;
    subtotal_amount: number | null;
    discount_amount: number | null;
    discount_note: string | null;
    total_amount: number;
    notes: string | null;
  };
  packages: PackagePrice[];
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function formatCurrencyPreview(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function EditBookingForm({ booking, packages }: EditBookingFormProps) {
  const initialSubtotal = resolveBookingSubtotal(
    booking.subtotal_amount,
    booking.total_amount,
    booking.discount_amount,
  );

  const [packageName, setPackageName] = useState(booking.package_name ?? "");
  const [totalPax, setTotalPax] = useState(booking.total_pax);
  const [subtotalAmount, setSubtotalAmount] = useState(initialSubtotal);
  const [discountAmount, setDiscountAmount] = useState(
    booking.discount_amount ?? 0,
  );

  const matchedPackage = useMemo(() => {
    const trimmed = packageName.trim();
    if (!trimmed) {
      return undefined;
    }

    return packages.find((pkg) => pkg.name === trimmed);
  }, [packageName, packages]);

  const pricePerPax = matchedPackage?.price_idr ?? null;
  const isAutoSubtotal = matchedPackage != null && pricePerPax != null;
  const finalTotal = calculateBookingFinalTotal(subtotalAmount, discountAmount);

  useEffect(() => {
    if (isAutoSubtotal) {
      setSubtotalAmount(calculateBookingTotalAmount(pricePerPax, totalPax));
    }
  }, [isAutoSubtotal, pricePerPax, totalPax]);

  return (
    <form action={updateBooking} className="space-y-5 rounded-lg border p-6">
      <input type="hidden" name="booking_id" value={booking.id} />
      <input type="hidden" name="subtotal_amount" value={subtotalAmount} />
      <input type="hidden" name="total_amount" value={finalTotal} />

      <div>
        <label className="text-sm font-medium">Package Name</label>
        <input
          name="package_name"
          value={packageName}
          onChange={(event) => setPackageName(event.target.value)}
          className={inputClassName}
          placeholder="Nama paket"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Departure Date</label>
        <input
          name="departure_date"
          type="date"
          defaultValue={toDateInputValue(booking.departure_date)}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Total Pax</label>
        <input
          name="total_pax"
          type="number"
          min={1}
          required
          value={totalPax}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            setTotalPax(Number.isNaN(parsed) ? 1 : parsed);
          }}
          className={inputClassName}
        />
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="text-sm font-semibold">Discount</h3>
          <p className="text-xs text-muted-foreground">
            Atur subtotal dan diskon untuk menghitung final total booking.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Subtotal / Original Amount</label>
          <input
            type="number"
            min={0}
            required
            value={subtotalAmount}
            readOnly={isAutoSubtotal}
            onChange={(event) => {
              if (!isAutoSubtotal) {
                const parsed = Number(event.target.value);
                setSubtotalAmount(Number.isNaN(parsed) ? 0 : parsed);
              }
            }}
            className={cn(inputClassName, isAutoSubtotal && "bg-muted")}
            placeholder="Contoh: 25000000"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {isAutoSubtotal
              ? "Subtotal mengikuti harga paket x jumlah pax."
              : "Masukkan subtotal manual jika paket tidak ditemukan."}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Discount Amount</label>
          <input
            name="discount_amount"
            type="number"
            min={0}
            value={discountAmount}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              setDiscountAmount(Number.isNaN(parsed) ? 0 : parsed);
            }}
            className={inputClassName}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Discount Note</label>
          <textarea
            name="discount_note"
            rows={2}
            defaultValue={booking.discount_note ?? ""}
            className={inputClassName}
            placeholder="Alasan diskon (opsional)"
          />
        </div>

        <div className="rounded-md bg-muted/40 p-4 text-sm">
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="whitespace-nowrap tabular-nums font-medium">
              {formatCurrencyPreview(subtotalAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-muted-foreground">Discount</span>
            <span className="whitespace-nowrap tabular-nums font-medium text-red-600">
              - {formatCurrencyPreview(Math.min(discountAmount, subtotalAmount))}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t pt-3">
            <span className="font-medium">Final Total</span>
            <span className="whitespace-nowrap tabular-nums text-base font-bold">
              {formatCurrencyPreview(finalTotal)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          rows={4}
          defaultValue={booking.notes ?? ""}
          className={inputClassName}
          placeholder="Catatan booking..."
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" className={cn(buttonVariants())}>
          Simpan Perubahan
        </button>
        <Link
          href={`/bookings/${booking.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

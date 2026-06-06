"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { updateBooking } from "@/app/(dashboard)/bookings/[id]/actions";
import { buttonVariants } from "@/components/ui/button";
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

export function EditBookingForm({ booking, packages }: EditBookingFormProps) {
  const [packageName, setPackageName] = useState(booking.package_name ?? "");
  const [totalPax, setTotalPax] = useState(booking.total_pax);
  const [totalAmount, setTotalAmount] = useState(booking.total_amount);

  const matchedPackage = useMemo(() => {
    const trimmed = packageName.trim();
    if (!trimmed) {
      return undefined;
    }

    return packages.find((pkg) => pkg.name === trimmed);
  }, [packageName, packages]);

  const pricePerPax = matchedPackage?.price_idr ?? null;
  const isAutoTotal = matchedPackage != null && pricePerPax != null;

  useEffect(() => {
    if (isAutoTotal) {
      setTotalAmount(calculateBookingTotalAmount(pricePerPax, totalPax));
    }
  }, [isAutoTotal, pricePerPax, totalPax]);

  return (
    <form action={updateBooking} className="space-y-5 rounded-lg border p-6">
      <input type="hidden" name="booking_id" value={booking.id} />

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

      <div>
        <label className="text-sm font-medium">Total Amount</label>
        <input
          name="total_amount"
          type="number"
          min={0}
          required
          value={totalAmount}
          readOnly={isAutoTotal}
          onChange={(event) => {
            if (!isAutoTotal) {
              const parsed = Number(event.target.value);
              setTotalAmount(Number.isNaN(parsed) ? 0 : parsed);
            }
          }}
          className={cn(inputClassName, isAutoTotal && "bg-muted")}
          placeholder="Contoh: 25000000"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Harga mengikuti harga paket x jumlah pax jika paket ditemukan.
        </p>
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

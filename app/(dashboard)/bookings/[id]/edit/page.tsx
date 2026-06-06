import Link from "next/link";
import { notFound } from "next/navigation";

import { updateBooking } from "../actions";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type BookingEdit = {
  id: string;
  booking_code: string | null;
  customer_name: string;
  package_name: string | null;
  departure_date: string | null;
  total_pax: number;
  total_amount: number;
  notes: string | null;
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export default async function EditBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount, notes",
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat data booking.");
  }

  if (!booking) {
    notFound();
  }

  const detail = booking as BookingEdit;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Booking</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui data booking {detail.booking_code || detail.customer_name}.
        </p>
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={updateBooking} className="space-y-5 rounded-lg border p-6">
        <input type="hidden" name="booking_id" value={detail.id} />

        <div>
          <label className="text-sm font-medium">Package Name</label>
          <input
            name="package_name"
            defaultValue={detail.package_name ?? ""}
            className={inputClassName}
            placeholder="Nama paket"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Departure Date</label>
          <input
            name="departure_date"
            type="date"
            defaultValue={toDateInputValue(detail.departure_date)}
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
            defaultValue={detail.total_pax}
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
            defaultValue={detail.total_amount}
            className={inputClassName}
            placeholder="Contoh: 25000000"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={detail.notes ?? ""}
            className={inputClassName}
            placeholder="Catatan booking..."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Perubahan
          </button>
          <Link
            href={`/bookings/${detail.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

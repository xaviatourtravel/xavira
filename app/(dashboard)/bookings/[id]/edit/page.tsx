import { notFound } from "next/navigation";

import { EditBookingForm } from "@/components/bookings/edit-booking-form";
import { requireProfile } from "@/lib/auth/session";
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

type PackagePrice = {
  name: string;
  price_idr: number | null;
};

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

  const [{ data: booking, error }, { data: packages }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount, notes",
      )
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("packages")
      .select("name, price_idr")
      .eq("organization_id", profile.organization_id)
      .order("name"),
  ]);

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

      <EditBookingForm
        booking={detail}
        packages={(packages ?? []) as PackagePrice[]}
      />
    </div>
  );
}

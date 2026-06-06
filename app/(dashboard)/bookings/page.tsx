import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

type BookingRow = {
  id: string;
  booking_code: string | null;
  customer_name: string;
  package_name: string | null;
  departure_date: string | null;
  total_pax: number;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function BookingsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount, payment_status, booking_status, created_at",
    )
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat data booking.");
  }

  const rows = (bookings ?? []) as BookingRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Daftar booking customer Xavia.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Belum ada booking</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Booking customer akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Booking Code</th>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Package Name</th>
                <th className="px-4 py-3 font-medium">Departure Date</th>
                <th className="px-4 py-3 font-medium">Total Pax</th>
                <th className="px-4 py-3 font-medium">Total Amount</th>
                <th className="px-4 py-3 font-medium">Payment Status</th>
                <th className="px-4 py-3 font-medium">Booking Status</th>
                <th className="px-4 py-3 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    {booking.booking_code || "-"}
                  </td>
                  <td className="px-4 py-3">{booking.customer_name}</td>
                  <td className="px-4 py-3">{booking.package_name || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {booking.departure_date
                      ? formatDate(booking.departure_date)
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{booking.total_pax}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatCurrency(Number(booking.total_amount))}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(booking.payment_status)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(booking.booking_status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(booking.created_at)}
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

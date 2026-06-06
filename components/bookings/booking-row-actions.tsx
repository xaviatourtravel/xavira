"use client";

import Link from "next/link";

import { deleteBooking } from "@/app/(dashboard)/bookings/actions";

type BookingRowActionsProps = {
  bookingId: string;
  returnTo: string;
};

export function BookingRowActions({
  bookingId,
  returnTo,
}: BookingRowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/bookings/${bookingId}/edit`}
        className="rounded border border-blue-600 px-2 py-1 text-xs text-blue-600"
      >
        Edit
      </Link>

      <form
        action={deleteBooking}
        onSubmit={(event) => {
          if (
            !confirm(
              "Yakin ingin menghapus booking ini? Data participant dan payment terkait juga akan dihapus.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="booking_id" value={bookingId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <button
          type="submit"
          className="rounded border border-red-600 px-2 py-1 text-xs text-red-600"
        >
          Hapus
        </button>
      </form>
    </div>
  );
}

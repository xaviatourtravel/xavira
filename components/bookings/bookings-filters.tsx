"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type BookingsFiltersProps = {
  search: string;
  paymentStatus: string;
  bookingStatus: string;
};

export function BookingsFilters({
  search: initialSearch,
  paymentStatus,
  bookingStatus,
}: BookingsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [, startTransition] = useTransition();

  const hasFilters =
    initialSearch.length > 0 ||
    paymentStatus.length > 0 ||
    bookingStatus.length > 0;

  const pushFilters = useCallback(
    (updates: {
      q?: string;
      payment_status?: string;
      booking_status?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.q !== undefined) {
        const value = updates.q.trim();
        if (value) {
          params.set("q", value);
        } else {
          params.delete("q");
        }
      }

      if (updates.payment_status !== undefined) {
        if (updates.payment_status) {
          params.set("payment_status", updates.payment_status);
        } else {
          params.delete("payment_status");
        }
      }

      if (updates.booking_status !== undefined) {
        if (updates.booking_status) {
          params.set("booking_status", updates.booking_status);
        } else {
          params.delete("booking_status");
        }
      }

      const query = params.toString();

      startTransition(() => {
        router.replace(query ? `/bookings?${query}` : "/bookings");
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === initialSearch) {
      return;
    }

    const timeout = window.setTimeout(() => {
      pushFilters({ q: trimmed });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, initialSearch, pushFilters]);

  return (
    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cari kode, customer, atau paket..."
        className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:min-w-[220px] sm:flex-1"
      />

      <select
        value={paymentStatus}
        onChange={(event) =>
          pushFilters({ payment_status: event.target.value })
        }
        className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
      >
        <option value="">All Payment Status</option>
        <option value="unpaid">Unpaid</option>
        <option value="dp_paid">DP Paid</option>
        <option value="fully_paid">Fully Paid</option>
        <option value="overpaid">Overpaid</option>
      </select>

      <select
        value={bookingStatus}
        onChange={(event) =>
          pushFilters({ booking_status: event.target.value })
        }
        className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
      >
        <option value="">All Booking Status</option>
        <option value="new">New</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>

      {hasFilters && (
        <Link
          href="/bookings"
          className="inline-flex min-h-[44px] items-center rounded-md border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Reset
        </Link>
      )}
    </div>
  );
}

"use client";

import {
  PassportField,
  PassportPerforation,
  PassportSection,
} from "@/components/customer-passport/primitives";
import type { CustomerPassport } from "@/lib/customer-passport/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PassportCommercialSection({
  passport,
}: {
  passport: CustomerPassport;
}) {
  const { commercial } = passport;

  return (
    <>
      <PassportSection number={6} title="Commercial">
        <div className="grid grid-cols-2 gap-3">
          <PassportField
            label="Lifetime Revenue"
            value={formatCurrency(commercial.lifetimeRevenueIdr)}
          />
          <PassportField
            label="Bookings"
            value={String(commercial.bookingCount)}
          />
          <PassportField
            label="Invoices"
            value={String(commercial.invoiceCount)}
          />
          <PassportField
            label="Outstanding"
            value={formatCurrency(commercial.outstandingPaymentIdr)}
          />
        </div>
      </PassportSection>
      <PassportPerforation />
    </>
  );
}

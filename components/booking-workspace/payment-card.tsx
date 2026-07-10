"use client";

import {
  AURORA_BOOKING_CARD,
  AURORA_BOOKING_CARD_BODY,
  AURORA_BOOKING_CARD_HEADER,
  AURORA_BOOKING_CARD_TITLE,
  AURORA_BOOKING_PAYMENT_METRIC,
  AURORA_BOOKING_PRIMARY_BUTTON,
  AURORA_BOOKING_PROGRESS_FILL,
  AURORA_BOOKING_PROGRESS_TRACK,
  AURORA_BOOKING_SECONDARY_BUTTON,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { formatCurrencyIdr } from "./mock-booking-workspace";
import type { BookingPaymentData, BookingWorkspaceLabels } from "./types";

type PaymentCardProps = {
  payment: BookingPaymentData;
  labels: BookingWorkspaceLabels;
  className?: string;
};

export function PaymentCard({ payment, labels, className }: PaymentCardProps) {
  const progressPercent = Math.min(
    100,
    Math.round((payment.paidAmount / payment.totalAmount) * 100),
  );

  return (
    <section className={cn(AURORA_BOOKING_CARD, className)}>
      <header className={AURORA_BOOKING_CARD_HEADER}>
        <h2 className={AURORA_BOOKING_CARD_TITLE}>{labels.payment}</h2>
      </header>
      <div className={cn(AURORA_BOOKING_CARD_BODY, "space-y-4")}>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatCurrencyIdr(payment.paidAmount)} / {formatCurrencyIdr(payment.totalAmount)}
            </span>
            <span className="tabular-nums">{progressPercent}%</span>
          </div>
          <div className={AURORA_BOOKING_PROGRESS_TRACK}>
            <div
              className={AURORA_BOOKING_PROGRESS_FILL}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={AURORA_BOOKING_PAYMENT_METRIC}>
            <p className="text-[11px] text-muted-foreground/70">{labels.deposit}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
              {formatCurrencyIdr(payment.depositAmount)}
            </p>
          </div>
          <div className={AURORA_BOOKING_PAYMENT_METRIC}>
            <p className="text-[11px] text-muted-foreground/70">{labels.paid}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-700">
              {formatCurrencyIdr(payment.paidAmount)}
            </p>
          </div>
          <div className={AURORA_BOOKING_PAYMENT_METRIC}>
            <p className="text-[11px] text-muted-foreground/70">{labels.remaining}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-amber-700">
              {formatCurrencyIdr(payment.remainingAmount)}
            </p>
          </div>
          <div className={AURORA_BOOKING_PAYMENT_METRIC}>
            <p className="text-[11px] text-muted-foreground/70">{labels.dueDate}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{payment.dueDate}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={AURORA_BOOKING_SECONDARY_BUTTON}>
            {labels.recordPayment}
          </button>
          <button type="button" className={AURORA_BOOKING_PRIMARY_BUTTON}>
            {labels.generateInvoice}
          </button>
        </div>
      </div>
    </section>
  );
}

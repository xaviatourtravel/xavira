"use client";

import { MoreHorizontal } from "lucide-react";

import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import {
  AURORA_BOOKING_CARD,
  AURORA_BOOKING_CARD_BODY,
  AURORA_BOOKING_CARD_HEADER,
  AURORA_BOOKING_CARD_TITLE,
  AURORA_BOOKING_PASSENGER_STATUS,
  AURORA_BOOKING_TABLE,
  AURORA_BOOKING_TABLE_ACTION,
  AURORA_BOOKING_TABLE_CELL,
  AURORA_BOOKING_TABLE_HEAD,
  AURORA_BOOKING_TABLE_ROW,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type {
  BookingPassenger,
  BookingWorkspaceLabels,
  PassengerReadinessStatus,
} from "./types";

type PassengerTableProps = {
  passengers: BookingPassenger[];
  labels: BookingWorkspaceLabels;
  className?: string;
};

const PASSENGER_STATUS_LABEL: Record<
  PassengerReadinessStatus,
  keyof Pick<
    BookingWorkspaceLabels,
    | "passengerStatusComplete"
    | "passengerStatusWaitingPassport"
    | "passengerStatusWaitingPayment"
    | "passengerStatusNeedVisa"
  >
> = {
  complete: "passengerStatusComplete",
  waiting_passport: "passengerStatusWaitingPassport",
  waiting_payment: "passengerStatusWaitingPayment",
  need_visa: "passengerStatusNeedVisa",
};

const PASSENGER_STATUS_CLASS: Record<PassengerReadinessStatus, string> = {
  complete: "bg-emerald-50 text-emerald-700",
  waiting_passport: "bg-amber-50 text-amber-700",
  waiting_payment: "bg-amber-50 text-amber-700",
  need_visa: "bg-rose-50 text-rose-700",
};

export function PassengerTable({ passengers, labels, className }: PassengerTableProps) {
  return (
    <section className={cn(AURORA_BOOKING_CARD, className)}>
      <header className={AURORA_BOOKING_CARD_HEADER}>
        <h2 className={AURORA_BOOKING_CARD_TITLE}>{labels.passengerList}</h2>
      </header>
      <div className={cn(AURORA_BOOKING_CARD_BODY, "overflow-x-auto p-0")}>
        <table className={AURORA_BOOKING_TABLE}>
          <thead>
            <tr className={AURORA_BOOKING_TABLE_HEAD}>
              <th className={cn(AURORA_BOOKING_TABLE_CELL, "w-10 pl-4")} scope="col" />
              <th className={AURORA_BOOKING_TABLE_CELL} scope="col">
                {labels.columnName}
              </th>
              <th className={AURORA_BOOKING_TABLE_CELL} scope="col">
                {labels.columnPassport}
              </th>
              <th className={AURORA_BOOKING_TABLE_CELL} scope="col">
                {labels.columnNationality}
              </th>
              <th className={AURORA_BOOKING_TABLE_CELL} scope="col">
                {labels.columnVisa}
              </th>
              <th className={AURORA_BOOKING_TABLE_CELL} scope="col">
                {labels.columnSeat}
              </th>
              <th className={AURORA_BOOKING_TABLE_CELL} scope="col">
                {labels.columnMeal}
              </th>
              <th className={AURORA_BOOKING_TABLE_CELL} scope="col">
                {labels.columnStatus}
              </th>
              <th className={cn(AURORA_BOOKING_TABLE_CELL, "pr-4 text-right")} scope="col">
                {labels.columnActions}
              </th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((passenger) => {
              const statusKey = PASSENGER_STATUS_LABEL[passenger.status];

              return (
                <tr key={passenger.id} className={AURORA_BOOKING_TABLE_ROW}>
                  <td className={cn(AURORA_BOOKING_TABLE_CELL, "pl-4")}>
                    <DesklabsAvatar
                      name={passenger.name}
                      imageUrl={passenger.avatarUrl}
                      size="sm"
                    />
                  </td>
                  <td className={cn(AURORA_BOOKING_TABLE_CELL, "font-medium")}>
                    {passenger.name}
                  </td>
                  <td className={cn(AURORA_BOOKING_TABLE_CELL, "tabular-nums text-muted-foreground")}>
                    {passenger.passport}
                  </td>
                  <td className={AURORA_BOOKING_TABLE_CELL}>{passenger.nationality}</td>
                  <td className={AURORA_BOOKING_TABLE_CELL}>{passenger.visa}</td>
                  <td className={cn(AURORA_BOOKING_TABLE_CELL, "tabular-nums")}>
                    {passenger.seat}
                  </td>
                  <td className={AURORA_BOOKING_TABLE_CELL}>{passenger.meal}</td>
                  <td className={AURORA_BOOKING_TABLE_CELL}>
                    <span
                      className={cn(
                        AURORA_BOOKING_PASSENGER_STATUS,
                        PASSENGER_STATUS_CLASS[passenger.status],
                      )}
                    >
                      {labels[statusKey]}
                    </span>
                  </td>
                  <td className={cn(AURORA_BOOKING_TABLE_CELL, "pr-4 text-right")}>
                    <button type="button" className={AURORA_BOOKING_TABLE_ACTION} aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

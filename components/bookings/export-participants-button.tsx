"use client";

import type { BookingParticipantItem } from "@/components/bookings/booking-participants-list";
import { downloadParticipantsCsv } from "@/lib/bookings/export-participants-csv";
import { cn } from "@/lib/utils";

type ExportParticipantsButtonProps = {
  bookingId: string;
  bookingCode: string | null;
  participants: BookingParticipantItem[];
};

export function ExportParticipantsButton({
  bookingId,
  bookingCode,
  participants,
}: ExportParticipantsButtonProps) {
  const isDisabled = participants.length === 0;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => {
        downloadParticipantsCsv(participants, bookingCode, bookingId);
      }}
      className={cn(
        "rounded-md border px-4 py-2 text-sm",
        isDisabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      Export Pax List
    </button>
  );
}

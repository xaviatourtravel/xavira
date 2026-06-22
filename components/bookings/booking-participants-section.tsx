import { AddParticipantModal } from "@/components/bookings/add-participant-modal";
import { ExportParticipantsButton } from "@/components/bookings/export-participants-button";
import {
  BookingParticipantsList,
  type BookingParticipantItem,
} from "@/components/bookings/booking-participants-list";

export type { BookingParticipantItem };

type BookingParticipantsSectionProps = {
  bookingId: string;
  bookingCode: string | null;
  participants: BookingParticipantItem[];
};

export function BookingParticipantsSection({
  bookingId,
  bookingCode,
  participants,
}: BookingParticipantsSectionProps) {
  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Participants</h2>
          <p className="text-sm text-muted-foreground">
            Daftar peserta untuk booking ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AddParticipantModal bookingId={bookingId} />
          <ExportParticipantsButton
            bookingId={bookingId}
            bookingCode={bookingCode}
            participants={participants}
          />
        </div>
      </div>

      <BookingParticipantsList
        bookingId={bookingId}
        participants={participants}
      />
    </div>
  );
}

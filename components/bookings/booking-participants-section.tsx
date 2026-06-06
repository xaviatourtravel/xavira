import { createBookingParticipant } from "@/app/(dashboard)/bookings/[id]/actions";
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

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export function BookingParticipantsSection({
  bookingId,
  bookingCode,
  participants,
}: BookingParticipantsSectionProps) {
  return (
    <div className="rounded-lg border p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Participants</h2>
          <p className="text-sm text-muted-foreground">
            Daftar peserta untuk booking ini.
          </p>
        </div>

        <ExportParticipantsButton
          bookingId={bookingId}
          bookingCode={bookingCode}
          participants={participants}
        />
      </div>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Add Participant
        </summary>

        <form
          action={createBookingParticipant}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="booking_id" value={bookingId} />

          <div>
            <label className="text-sm font-medium">Full Name *</label>
            <input
              name="full_name"
              required
              className={inputClassName}
              placeholder="Nama lengkap peserta"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              name="phone"
              className={inputClassName}
              placeholder="Contoh: 6281212345678"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Passport Number</label>
            <input
              name="passport_number"
              className={inputClassName}
              placeholder="Nomor paspor"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Passport Photo URL</label>
            <input
              name="passport_photo_url"
              type="url"
              className={inputClassName}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <textarea
              name="address"
              rows={2}
              className={inputClassName}
              placeholder="Alamat peserta"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Emergency Contact</label>
            <input
              name="emergency_contact"
              className={inputClassName}
              placeholder="Kontak darurat"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className={inputClassName}
              placeholder="Catatan peserta"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Simpan Participant
          </button>
        </form>
      </details>

      <BookingParticipantsList
        bookingId={bookingId}
        participants={participants}
      />
    </div>
  );
}

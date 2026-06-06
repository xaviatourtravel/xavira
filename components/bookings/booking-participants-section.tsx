import {
  createBookingParticipant,
  deleteBookingParticipant,
} from "@/app/(dashboard)/bookings/[id]/actions";

export type BookingParticipantItem = {
  id: string;
  full_name: string;
  phone: string | null;
  passport_number: string | null;
  emergency_contact: string | null;
};

type BookingParticipantsSectionProps = {
  bookingId: string;
  participants: BookingParticipantItem[];
};

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export function BookingParticipantsSection({
  bookingId,
  participants,
}: BookingParticipantsSectionProps) {
  return (
    <div className="rounded-lg border p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Participants</h2>
        <p className="text-sm text-muted-foreground">
          Daftar peserta untuk booking ini.
        </p>
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

      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada participant untuk booking ini.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Full Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Passport Number</th>
                <th className="px-4 py-3 font-medium">Emergency Contact</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    {participant.full_name}
                  </td>
                  <td className="px-4 py-3">{participant.phone || "-"}</td>
                  <td className="px-4 py-3">
                    {participant.passport_number || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {participant.emergency_contact || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteBookingParticipant}>
                      <input
                        type="hidden"
                        name="booking_id"
                        value={bookingId}
                      />
                      <input
                        type="hidden"
                        name="participant_id"
                        value={participant.id}
                      />
                      <button
                        type="submit"
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                      >
                        Hapus
                      </button>
                    </form>
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

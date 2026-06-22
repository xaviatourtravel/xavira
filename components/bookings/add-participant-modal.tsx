"use client";

import { useState } from "react";

import { createBookingParticipant } from "@/app/(dashboard)/bookings/[id]/actions";
import { ParticipantFormFields } from "@/components/bookings/participant-form-fields";
import { ParticipantModalShell } from "@/components/bookings/participant-modal-shell";

type AddParticipantModalProps = {
  bookingId: string;
};

export function AddParticipantModal({ bookingId }: AddParticipantModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        Add Participant
      </button>

      {open ? (
        <ParticipantModalShell
          title="Add Participant"
          description="Tambahkan peserta baru untuk booking ini."
          onClose={() => setOpen(false)}
          ariaLabelledBy="add-participant-modal-title"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-participant-form"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Simpan Participant
              </button>
            </div>
          }
        >
          <form
            id="add-participant-form"
            action={createBookingParticipant}
            className="flex min-h-0 flex-1 flex-col"
          >
            <input type="hidden" name="booking_id" value={bookingId} />

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              <ParticipantFormFields />
            </div>
          </form>
        </ParticipantModalShell>
      ) : null}
    </>
  );
}

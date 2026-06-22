"use client";

import { useState } from "react";

import {
  deleteBookingParticipant,
  updateBookingParticipant,
} from "@/app/(dashboard)/bookings/[id]/actions";
import { ParticipantFormFields } from "@/components/bookings/participant-form-fields";
import { ParticipantModalShell } from "@/components/bookings/participant-modal-shell";
import { ParticipantDocumentChecklist } from "@/components/bookings/participant-document-checklist";

export type BookingParticipantItem = {
  id: string;
  full_name: string;
  phone: string | null;
  passport_number: string | null;
  passport_photo_url: string | null;
  address: string | null;
  emergency_contact: string | null;
  notes: string | null;
};

type BookingParticipantsListProps = {
  bookingId: string;
  participants: BookingParticipantItem[];
};

export function BookingParticipantsList({
  bookingId,
  participants,
}: BookingParticipantsListProps) {
  const [editingParticipant, setEditingParticipant] =
    useState<BookingParticipantItem | null>(null);

  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada participant untuk booking ini.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Full Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Passport Number</th>
              <th className="px-4 py-3 font-medium">Emergency Contact</th>
              <th className="px-4 py-3 font-medium">Documents</th>
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
                  <ParticipantDocumentChecklist
                    passportNumber={participant.passport_number}
                    passportPhotoUrl={participant.passport_photo_url}
                    emergencyContact={participant.emergency_contact}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingParticipant(participant)}
                      className="rounded border border-blue-600 px-2 py-1 text-xs text-blue-600"
                    >
                      Edit
                    </button>
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
                        className="rounded border border-red-600 px-2 py-1 text-xs text-red-600"
                      >
                        Hapus
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingParticipant ? (
        <ParticipantModalShell
          title="Edit Participant"
          description="Perbarui data peserta booking."
          onClose={() => setEditingParticipant(null)}
          ariaLabelledBy="edit-participant-modal-title"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingParticipant(null)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                form="edit-participant-form"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Simpan Perubahan
              </button>
            </div>
          }
        >
          <form
            id="edit-participant-form"
            action={updateBookingParticipant}
            className="flex min-h-0 flex-1 flex-col"
          >
            <input type="hidden" name="booking_id" value={bookingId} />
            <input
              type="hidden"
              name="participant_id"
              value={editingParticipant.id}
            />

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              <ParticipantFormFields participant={editingParticipant} />
            </div>
          </form>
        </ParticipantModalShell>
      ) : null}
    </>
  );
}

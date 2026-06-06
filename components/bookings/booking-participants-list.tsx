"use client";

import { useState } from "react";

import {
  deleteBookingParticipant,
  updateBookingParticipant,
} from "@/app/(dashboard)/bookings/[id]/actions";
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

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

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

      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Tutup modal"
            onClick={() => setEditingParticipant(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Edit Participant</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Perbarui data peserta booking.
            </p>

            <form
              action={updateBookingParticipant}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="booking_id" value={bookingId} />
              <input
                type="hidden"
                name="participant_id"
                value={editingParticipant.id}
              />

              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input
                  name="full_name"
                  required
                  defaultValue={editingParticipant.full_name}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  name="phone"
                  defaultValue={editingParticipant.phone ?? ""}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Passport Number</label>
                <input
                  name="passport_number"
                  defaultValue={editingParticipant.passport_number ?? ""}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Passport Photo URL</label>
                <input
                  name="passport_photo_url"
                  type="url"
                  defaultValue={editingParticipant.passport_photo_url ?? ""}
                  className={inputClassName}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <textarea
                  name="address"
                  rows={2}
                  defaultValue={editingParticipant.address ?? ""}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Emergency Contact</label>
                <input
                  name="emergency_contact"
                  defaultValue={editingParticipant.emergency_contact ?? ""}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingParticipant.notes ?? ""}
                  className={inputClassName}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

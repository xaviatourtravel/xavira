import {
  participantInputClassName,
  participantUrlInputClassName,
} from "@/components/bookings/participant-modal-shell";

type ParticipantFormFieldsProps = {
  participant?: {
    full_name: string;
    phone: string | null;
    passport_number: string | null;
    passport_photo_url: string | null;
    address: string | null;
    emergency_contact: string | null;
    notes: string | null;
  };
};

export function ParticipantFormFields({ participant }: ParticipantFormFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Full Name *</label>
        <input
          name="full_name"
          required
          defaultValue={participant?.full_name ?? ""}
          className={participantInputClassName}
          placeholder="Nama lengkap peserta"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Phone</label>
        <input
          name="phone"
          defaultValue={participant?.phone ?? ""}
          className={participantInputClassName}
          placeholder="Contoh: 6281212345678"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Passport Number</label>
        <input
          name="passport_number"
          defaultValue={participant?.passport_number ?? ""}
          className={participantInputClassName}
          placeholder="Nomor paspor"
        />
      </div>

      <div className="min-w-0">
        <label className="text-sm font-medium">Passport Photo URL</label>
        <input
          name="passport_photo_url"
          type="url"
          defaultValue={participant?.passport_photo_url ?? ""}
          className={participantUrlInputClassName}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Address</label>
        <textarea
          name="address"
          rows={2}
          defaultValue={participant?.address ?? ""}
          className={participantInputClassName}
          placeholder="Alamat peserta"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Emergency Contact</label>
        <input
          name="emergency_contact"
          defaultValue={participant?.emergency_contact ?? ""}
          className={participantInputClassName}
          placeholder="Kontak darurat"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={participant?.notes ?? ""}
          className={participantInputClassName}
          placeholder="Catatan peserta"
        />
      </div>
    </div>
  );
}

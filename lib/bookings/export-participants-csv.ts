export type ParticipantCsvRow = {
  full_name: string;
  phone: string | null;
  passport_number: string | null;
  address: string | null;
  emergency_contact: string | null;
  notes: string | null;
};

const CSV_HEADERS = [
  "Full Name",
  "Phone",
  "Passport Number",
  "Address",
  "Emergency Contact",
  "Notes",
] as const;

function escapeCsvField(value: string | null | undefined) {
  const normalized = value ?? "";

  if (/[",\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function participantToCsvRow(participant: ParticipantCsvRow) {
  return [
    participant.full_name,
    participant.phone,
    participant.passport_number,
    participant.address,
    participant.emergency_contact,
    participant.notes,
  ]
    .map(escapeCsvField)
    .join(",");
}

export function buildParticipantsCsv(participants: ParticipantCsvRow[]) {
  const rows = [
    CSV_HEADERS.join(","),
    ...participants.map(participantToCsvRow),
  ];

  return `\uFEFF${rows.join("\r\n")}`;
}

export function getParticipantsCsvFilename(
  bookingCode: string | null,
  bookingId: string,
) {
  const slug = (bookingCode || bookingId).replace(/[^a-zA-Z0-9-_]/g, "-");
  return `participants-${slug}.csv`;
}

export function downloadParticipantsCsv(
  participants: ParticipantCsvRow[],
  bookingCode: string | null,
  bookingId: string,
) {
  const csv = buildParticipantsCsv(participants);
  const filename = getParticipantsCsvFilename(bookingCode, bookingId);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

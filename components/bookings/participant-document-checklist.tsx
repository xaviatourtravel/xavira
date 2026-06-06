import { cn } from "@/lib/utils";

type ParticipantDocumentChecklistProps = {
  passportNumber: string | null;
  passportPhotoUrl: string | null;
  emergencyContact: string | null;
};

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

type DocumentCheckBadgeProps = {
  isComplete: boolean;
  completeLabel: string;
  missingLabel: string;
};

function DocumentCheckBadge({
  isComplete,
  completeLabel,
  missingLabel,
}: DocumentCheckBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        isComplete
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800",
      )}
    >
      {isComplete ? completeLabel : missingLabel}
    </span>
  );
}

export function ParticipantDocumentChecklist({
  passportNumber,
  passportPhotoUrl,
  emergencyContact,
}: ParticipantDocumentChecklistProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <DocumentCheckBadge
        isComplete={hasValue(passportNumber)}
        completeLabel="Passport Number OK"
        missingLabel="Passport Number Missing"
      />
      <DocumentCheckBadge
        isComplete={hasValue(passportPhotoUrl)}
        completeLabel="Passport Photo OK"
        missingLabel="Passport Photo Missing"
      />
      <DocumentCheckBadge
        isComplete={hasValue(emergencyContact)}
        completeLabel="Emergency Contact OK"
        missingLabel="Emergency Contact Missing"
      />
    </div>
  );
}

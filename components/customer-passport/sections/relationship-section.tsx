"use client";

import {
  PassportEmptyHint,
  PassportField,
  PassportPerforation,
  PassportSection,
} from "@/components/customer-passport/primitives";
import type { CustomerPassport } from "@/lib/customer-passport/types";

function formatRelativeTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PassportRelationshipSection({
  passport,
}: {
  passport: CustomerPassport;
}) {
  const { relationship } = passport;

  return (
    <>
      <PassportSection number={2} title="Relationship">
        <div className="grid grid-cols-2 gap-3">
          <PassportField label="Owner" value={relationship.ownerName} />
          <PassportField
            label="Relationship Score"
            value={
              relationship.relationshipScore != null
                ? `${relationship.relationshipScore}${relationship.relationshipLabel ? ` · ${relationship.relationshipLabel}` : ""}`
                : null
            }
          />
          <PassportField
            label="First Contact"
            value={formatRelativeTime(relationship.firstContactAt)}
          />
          <PassportField
            label="Last Interaction"
            value={formatRelativeTime(relationship.lastInteractionAt)}
          />
          <PassportField
            label="Response Time"
            value={
              relationship.avgResponseTimeMinutes != null
                ? `${relationship.avgResponseTimeMinutes} min avg`
                : "Tracking soon"
            }
          />
        </div>
        {!relationship.ownerName ? (
          <div className="mt-3">
            <PassportEmptyHint>
              No owner assigned yet. Assign from Workflow to strengthen the
              relationship.
            </PassportEmptyHint>
          </div>
        ) : null}
      </PassportSection>
      <PassportPerforation />
    </>
  );
}

import { memo } from "react";

import {
  IntelligenceEmpty,
  IntelligenceField,
  IntelligencePreviewBadge,
  IntelligenceSection,
  IntelligenceSurface,
} from "@/components/communication-workspace/primitives";
import type {
  WorkspaceExtractedFields,
  WorkspaceIntelligencePlaceholder,
} from "@/lib/communication-workspace/types";

type ExtractedInfoSectionProps = {
  intelligence: WorkspaceIntelligencePlaceholder;
  fields: WorkspaceExtractedFields;
  onFieldChange: (key: keyof WorkspaceExtractedFields, value: string) => void;
};

export const ExtractedInfoSection = memo(function ExtractedInfoSection({
  intelligence,
  fields,
  onFieldChange,
}: ExtractedInfoSectionProps) {
  const isPending = intelligence.state === "pending";
  const readOnly = isPending;

  return (
    <IntelligenceSection
      title="AI Extracted Information"
      badge={!isPending ? <IntelligencePreviewBadge /> : null}
    >
      {isPending ? (
        <IntelligenceEmpty>
          Structured fields — name, destination, dates, pax, budget — will be
          extracted automatically from the conversation.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="grid gap-3 p-4">
          <IntelligenceField
            label="Name"
            value={fields.name}
            placeholder="Not detected"
            readOnly={readOnly}
            onChange={(value) => onFieldChange("name", value)}
          />
          <IntelligenceField
            label="Destination"
            value={fields.destination}
            placeholder="Not detected"
            readOnly={readOnly}
            onChange={(value) => onFieldChange("destination", value)}
          />
          <IntelligenceField
            label="Departure"
            value={fields.departure}
            placeholder="Not specified"
            type="date"
            readOnly={readOnly}
            onChange={(value) => onFieldChange("departure", value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <IntelligenceField
              label="Pax"
              value={fields.pax}
              placeholder="—"
              readOnly={readOnly}
              onChange={(value) => onFieldChange("pax", value)}
            />
            <IntelligenceField
              label="Budget"
              value={fields.budget}
              placeholder="—"
              readOnly={readOnly}
              onChange={(value) => onFieldChange("budget", value)}
            />
          </div>
          <IntelligenceField
            label="City"
            value={fields.city}
            placeholder="Not detected"
            readOnly={readOnly}
            onChange={(value) => onFieldChange("city", value)}
          />
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});

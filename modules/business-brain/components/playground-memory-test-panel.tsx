"use client";

import { DsField, DsTextInput } from "@/components/design-system/form-controls";
import {
  MEMORY_KEY_LABELS,
  PLAYGROUND_MEMORY_TEST_KEYS,
  type PlaygroundMemoryTestInput,
} from "@/modules/ai/types/memory";

type PlaygroundMemoryTestPanelProps = {
  memoryTest: PlaygroundMemoryTestInput;
  canEdit: boolean;
  onMemoryTestChange: (value: PlaygroundMemoryTestInput) => void;
};

export function PlaygroundMemoryTestPanel({
  memoryTest,
  canEdit,
  onMemoryTestChange,
}: PlaygroundMemoryTestPanelProps) {
  const updateField = (field: keyof PlaygroundMemoryTestInput, value: string) => {
    onMemoryTestChange({ ...memoryTest, [field]: value });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Customer Memory</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pre-fill customer memory to test how prior context affects responses.
        </p>
      </div>

      {PLAYGROUND_MEMORY_TEST_KEYS.map((key) => (
        <DsField key={key} label={MEMORY_KEY_LABELS[key]}>
          <DsTextInput
            value={memoryTest[key]}
            onChange={(event) => updateField(key, event.target.value)}
            placeholder={
              key === "destination"
                ? "e.g. Jepang"
                : key === "departure_month"
                  ? "e.g. Oktober"
                  : key === "passenger_count"
                    ? "e.g. 4"
                    : key === "budget"
                      ? "e.g. 25 juta"
                      : key === "trip_type"
                        ? "e.g. Family Trip"
                        : "e.g. Halal"
            }
            disabled={!canEdit}
          />
        </DsField>
      ))}
    </div>
  );
}

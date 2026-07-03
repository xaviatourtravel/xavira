"use client";

import { Play } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import {
  DsField,
  DsTextInput,
  DsTextarea,
} from "@/components/design-system/form-controls";
import {
  DEFAULT_PLAYGROUND_CONTEXT,
  type PlaygroundCustomerContext,
} from "@/modules/business-brain/types/playground";

type PlaygroundTestInputPanelProps = {
  customerMessage: string;
  context: PlaygroundCustomerContext;
  canEdit: boolean;
  isRunning: boolean;
  llmConfigured: boolean;
  errorMessage: string | null;
  onCustomerMessageChange: (value: string) => void;
  onContextChange: (context: PlaygroundCustomerContext) => void;
  onRunTest: () => void;
};

export function PlaygroundTestInputPanel({
  customerMessage,
  context,
  canEdit,
  isRunning,
  llmConfigured,
  errorMessage,
  onCustomerMessageChange,
  onContextChange,
  onRunTest,
}: PlaygroundTestInputPanelProps) {
  const updateContext = (field: keyof PlaygroundCustomerContext, value: string) => {
    onContextChange({ ...context, [field]: value });
  };

  return (
    <DsCard title="Test Input" description="Simulate a customer message and optional context.">
      <div className="space-y-4">
        <DsField label="Customer Message">
          <DsTextarea
            value={customerMessage}
            onChange={(event) => onCustomerMessageChange(event.target.value)}
            rows={5}
            placeholder="e.g. Halo kak, saya mau tanya paket umrah bulan September untuk 4 orang"
            disabled={!canEdit}
          />
        </DsField>

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">Optional Customer Context</p>
          <DsField label="Customer Name">
            <DsTextInput
              value={context.customerName}
              onChange={(event) => updateContext("customerName", event.target.value)}
              placeholder="e.g. Rina"
              disabled={!canEdit}
            />
          </DsField>
          <DsField label="Destination Interest">
            <DsTextInput
              value={context.destinationInterest}
              onChange={(event) => updateContext("destinationInterest", event.target.value)}
              placeholder="e.g. Umrah, Turki"
              disabled={!canEdit}
            />
          </DsField>
          <div className="grid gap-3 sm:grid-cols-2">
            <DsField label="Budget">
              <DsTextInput
                value={context.budget}
                onChange={(event) => updateContext("budget", event.target.value)}
                placeholder="e.g. 35 juta"
                disabled={!canEdit}
              />
            </DsField>
            <DsField label="Departure Month">
              <DsTextInput
                value={context.departureMonth}
                onChange={(event) => updateContext("departureMonth", event.target.value)}
                placeholder="e.g. September 2026"
                disabled={!canEdit}
              />
            </DsField>
          </div>
          <DsField label="Passenger Count">
            <DsTextInput
              value={context.passengerCount}
              onChange={(event) => updateContext("passengerCount", event.target.value)}
              placeholder="e.g. 4"
              disabled={!canEdit}
            />
          </DsField>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        <DsButton
          type="button"
          className="w-full"
          onClick={onRunTest}
          loading={isRunning}
          disabled={!canEdit || !customerMessage.trim() || !llmConfigured}
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Testing AI..." : "Run Test"}
        </DsButton>

        <p className="text-xs text-muted-foreground">
          Uses draft Business Brain data with live LLM preview.
        </p>
      </div>
    </DsCard>
  );
}

export { DEFAULT_PLAYGROUND_CONTEXT };

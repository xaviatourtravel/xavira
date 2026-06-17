"use client";

import { useState } from "react";

import { snoozeLead } from "@/app/(dashboard)/leads/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatSnoozeUntilLabel } from "@/lib/automation/snooze";

type SnoozeLeadCardProps = {
  leadId: string;
  snoozeUntil: string | null;
};

export function SnoozeLeadCard({ leadId, snoozeUntil }: SnoozeLeadCardProps) {
  const [preset, setPreset] = useState("tomorrow");
  const snoozeLabel = formatSnoozeUntilLabel(snoozeUntil);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snooze Lead</CardTitle>
        <CardDescription>
          Sembunyikan lead dari follow-up queue sementara tanpa mengubah
          assignment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {snoozeLabel && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Lead sedang di-snooze hingga {snoozeLabel}.
          </div>
        )}

        <form action={snoozeLead} className="space-y-4">
          <input type="hidden" name="lead_id" value={leadId} />

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { value: "tomorrow", label: "Tomorrow" },
              { value: "3_days", label: "3 Days" },
              { value: "1_week", label: "1 Week" },
              { value: "custom", label: "Custom Date" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="snooze_preset"
                  value={option.value}
                  checked={preset === option.value}
                  onChange={() => setPreset(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          {preset === "custom" && (
            <div>
              <label htmlFor="snooze_custom_date" className="text-sm font-medium">
                Custom Date
              </label>
              <input
                id="snooze_custom_date"
                name="snooze_custom_date"
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Snooze Lead</Button>
            {snoozeUntil && (
              <Button type="submit" name="clear_snooze" value="true" variant="outline">
                Clear Snooze
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

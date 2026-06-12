"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateLeadTemperature } from "@/app/(dashboard)/leads/actions";
import { LeadTemperatureBadge } from "@/components/leads/lead-temperature-badge";
import {
  getEffectiveLeadTemperature,
  type LeadTemperature,
} from "@/lib/leads/lead-temperature";
import { cn } from "@/lib/utils";

type LeadTemperatureInlineSelectProps = {
  leadId: string;
  leadTemperature: string | null;
  status: string;
  updatedAt: string;
  canEdit: boolean;
};

export function LeadTemperatureInlineSelect({
  leadId,
  leadTemperature,
  status,
  updatedAt,
  canEdit,
}: LeadTemperatureInlineSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const effective = getEffectiveLeadTemperature({
    lead_temperature: leadTemperature,
    status,
    updated_at: updatedAt,
  });

  if (!canEdit) {
    return (
      <LeadTemperatureBadge
        value={effective.value}
        isSuggested={effective.isSuggested}
      />
    );
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextValue = event.target.value;
    setError(null);

    startTransition(async () => {
      const result = await updateLeadTemperature(leadId, nextValue);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  const selectValue =
    leadTemperature === "hot" ||
    leadTemperature === "warm" ||
    leadTemperature === "cold"
      ? leadTemperature
      : "";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <LeadTemperatureBadge
          value={effective.value as LeadTemperature}
          isSuggested={effective.isSuggested}
        />
        <select
          value={selectValue}
          onChange={handleChange}
          disabled={isPending}
          aria-label="Ubah suhu lead"
          className={cn(
            "rounded-md border px-2 py-1 text-xs",
            isPending && "opacity-60",
          )}
        >
          <option value="">Auto</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

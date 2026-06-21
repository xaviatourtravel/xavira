"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import { extractOmnichannelLeadInfo } from "@/app/(dashboard)/inbox/omnichannel-ai-actions";
import { buttonVariants } from "@/components/ui/button";
import {
  formatExtractionConfidenceLabel,
  getExtractionConfidenceClassName,
  mapExtractionToConvertFormPrefill,
  type ConvertLeadFormPrefill,
  type ExtractedLeadField,
  type InboxLeadExtractionData,
} from "@/lib/omnichannel-inbox/ai-lead-extraction";
import { cn } from "@/lib/utils";

type InboxLeadExtractionCardProps = {
  conversationId: string;
  customerName: string;
  disabled?: boolean;
  onApply: (prefill: ConvertLeadFormPrefill) => void;
};

type ExtractionRow = {
  label: string;
  field: ExtractedLeadField<string | number | null>;
  formatValue?: (value: string | number) => string;
};

function formatFieldDisplay(
  field: ExtractedLeadField<string | number | null>,
  formatValue?: (value: string | number) => string,
) {
  if (field.value == null || field.value === "") {
    return "Not found in conversation";
  }

  return formatValue ? formatValue(field.value) : String(field.value);
}

function buildExtractionRows(
  extraction: InboxLeadExtractionData,
): ExtractionRow[] {
  return [
    { label: "Customer name", field: extraction.fullName },
    { label: "Phone", field: extraction.phone },
    { label: "Email", field: extraction.email },
    { label: "Destination", field: extraction.destinationInterest },
    { label: "Travel date", field: extraction.travelDate },
    {
      label: "Pax",
      field: extraction.partySize,
      formatValue: (value) => String(value),
    },
    {
      label: "Budget",
      field: extraction.budgetIdr,
      formatValue: (value) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(Number(value)),
    },
    { label: "Package interest", field: extraction.packageInterest },
    { label: "Urgency / intent", field: extraction.urgencyIntent },
    { label: "Notes summary", field: extraction.notesSummary },
  ];
}

export function InboxLeadExtractionCard({
  conversationId,
  customerName,
  disabled = false,
  onApply,
}: InboxLeadExtractionCardProps) {
  const [extraction, setExtraction] = useState<InboxLeadExtractionData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyzeTransition] = useTransition();

  function handleExtract() {
    if (disabled || isAnalyzing) {
      return;
    }

    setError(null);

    startAnalyzeTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);

      const result = await extractOmnichannelLeadInfo(formData);

      if (!result.success || !result.extraction) {
        setError(result.message ?? "AI extraction failed. Please try again.");
        return;
      }

      setExtraction(result.extraction);
    });
  }

  function handleApply() {
    if (!extraction) {
      return;
    }

    onApply(mapExtractionToConvertFormPrefill(extraction, customerName));
  }

  return (
    <section className="rounded-xl border border-dashed border-violet-200 bg-violet-50/30 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-medium text-foreground">AI Lead Extraction</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Extract structured lead fields from this conversation. Review before
              applying to the convert form.
            </p>
          </div>

          <button
            type="button"
            disabled={disabled || isAnalyzing}
            onClick={handleExtract}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-7 w-full border-violet-200 bg-background/80 text-xs hover:bg-background",
            )}
          >
            {isAnalyzing ? "Analyzing conversation..." : "✨ Extract Lead Info"}
          </button>

          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

          {extraction ? (
            <div className="space-y-2 rounded-lg border bg-background/90 p-2.5">
              {buildExtractionRows(extraction).map((row) => {
                const isMissing =
                  row.field.value == null || row.field.value === "";

                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-foreground">
                        {row.label}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                          getExtractionConfidenceClassName(row.field.confidence),
                        )}
                      >
                        {formatExtractionConfidenceLabel(row.field.confidence)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-[11px] leading-relaxed",
                        isMissing
                          ? "italic text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {formatFieldDisplay(row.field, row.formatValue)}
                    </p>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleApply}
                className={cn(buttonVariants({ size: "sm" }), "mt-1 w-full")}
              >
                Apply to lead form
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

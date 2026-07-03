"use client";

import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import { cn } from "@/lib/utils";

type WhatsappLeadProgressBadgeProps = {
  qualification: LeadQualificationSnapshot | null | undefined;
  className?: string;
};

function buildProgressBar(score: number) {
  const filledBlocks = Math.round(score / 10);
  return `${"█".repeat(filledBlocks)}${"░".repeat(10 - filledBlocks)}`;
}

function buildTooltip(qualification: LeadQualificationSnapshot) {
  return qualification.fieldProgress
    .map((field) => `${field.label} ${field.completed ? "✓" : "✕"}`)
    .join("\n");
}

export function WhatsappLeadProgressBadge({
  qualification,
  className,
}: WhatsappLeadProgressBadgeProps) {
  if (!qualification) {
    return null;
  }

  const tooltip = buildTooltip(qualification);

  return (
    <div
      className={cn(
        "hidden items-center gap-2 rounded-full border border-border bg-muted/30 px-2.5 py-1 sm:flex",
        className,
      )}
      title={tooltip}
      aria-label={`Lead progress ${qualification.completionScore} percent`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Lead Progress
      </span>
      <span className="font-mono text-[10px] leading-none text-foreground">
        {buildProgressBar(qualification.completionScore)}
      </span>
      <span className="text-[10px] font-semibold text-foreground">
        {qualification.completionScore}%
      </span>
    </div>
  );
}

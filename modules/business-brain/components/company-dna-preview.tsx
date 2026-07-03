"use client";

import { useMemo } from "react";
import { Bot, MessageCircle } from "lucide-react";

import { DsCard } from "@/components/design-system/card";
import {
  COMPANY_DNA_PREVIEW_CUSTOMER_MESSAGE,
  generateCompanyDnaPreviewReply,
} from "@/modules/business-brain/lib/generate-preview-reply";
import type { CompanyDnaFormValues } from "@/modules/business-brain/types/company-dna";
import { cn } from "@/lib/utils";

type CompanyDnaPreviewProps = {
  values: CompanyDnaFormValues;
};

function PreviewBubble({
  role,
  children,
}: {
  role: "customer" | "ai";
  children: string;
}) {
  const isAi = role === "ai";

  return (
    <div className={cn("flex gap-2", isAi ? "justify-start" : "justify-end")}>
      {isAi ? (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
          isAi
            ? "rounded-tl-md bg-card text-foreground ring-1 ring-border"
            : "rounded-tr-md bg-primary text-primary-foreground",
        )}
      >
        {children}
      </div>
      {!isAi ? (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </div>
  );
}

export function CompanyDnaPreview({ values }: CompanyDnaPreviewProps) {
  const aiReply = useMemo(
    () => generateCompanyDnaPreviewReply(values),
    [values],
  );

  return (
    <DsCard
      title="Live Preview"
      description="Simulated conversation based on your current Company DNA."
      className="lg:sticky lg:top-36"
    >
      <div className="space-y-4">
        <PreviewBubble role="customer">
          {COMPANY_DNA_PREVIEW_CUSTOMER_MESSAGE}
        </PreviewBubble>
        <PreviewBubble role="ai">{aiReply}</PreviewBubble>
        <p className="text-xs text-muted-foreground">
          Preview updates instantly as you edit. No AI call is made.
        </p>
      </div>
    </DsCard>
  );
}

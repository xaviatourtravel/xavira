"use client";

import { DsCard } from "@/components/design-system/card";
import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import { LEAD_QUALIFICATION_FIELD_RULES } from "@/modules/ai/types/lead-qualification";
import type { ConversationMemoryPromptItem } from "@/modules/ai/types/memory";
import {
  isConversationMemoryKey,
  MEMORY_KEY_LABELS,
} from "@/modules/ai/types/memory";
import type {
  PlaygroundAvailableContext,
  PlaygroundContextSection,
} from "@/modules/business-brain/types/playground";
import { cn } from "@/lib/utils";

type PlaygroundContextInspectorProps = {
  context: PlaygroundAvailableContext | null;
  mode: "available" | "used";
  retrievalSummary?: RetrievalSummary | null;
  customerMemoryUsed?: ConversationMemoryPromptItem[] | null;
  leadQualification?: LeadQualificationSnapshot | null;
};

function ContextSection({ section }: { section: PlaygroundContextSection }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
      {section.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          {section.emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2">
          {section.items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-background px-3 py-2"
            >
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              {item.detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CustomerMemoryUsedSection({
  memory,
}: {
  memory: ConversationMemoryPromptItem[];
}) {
  if (memory.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Customer Memory Used</h4>
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No customer memory was included in this prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">Customer Memory Used</h4>
      <ul className="space-y-2">
        {memory.map((item) => {
          const label = isConversationMemoryKey(item.memory_key)
            ? MEMORY_KEY_LABELS[item.memory_key]
            : item.memory_key;

          return (
            <li
              key={item.memory_key}
              className="rounded-lg border border-border bg-background px-3 py-2"
            >
              <p className="text-sm font-medium text-foreground">
                {label}: {item.memory_value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Confidence {(item.confidence * 100).toFixed(0)}%
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SECTION_ORDER: Array<keyof PlaygroundAvailableContext> = [
  "companyDna",
  "products",
  "knowledge",
  "documents",
  "behaviors",
  "handoverRules",
];

function LeadQualificationSection({
  qualification,
}: {
  qualification: LeadQualificationSnapshot;
}) {
  const missingLabels = qualification.missingFields.map((fieldKey) => {
    const rule = LEAD_QUALIFICATION_FIELD_RULES.find((item) => item.key === fieldKey);
    return rule?.label ?? fieldKey;
  });

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">Lead Qualification</h4>
      <div className="rounded-lg border border-border bg-background px-3 py-2">
        <p className="text-sm font-medium text-foreground">
          Completion: {qualification.completionScore}%
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Status: {qualification.qualificationStatus}
        </p>
        <p className="mt-2 text-xs font-medium text-foreground">Missing Fields</p>
        {missingLabels.length > 0 ? (
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {missingLabels.map((label) => (
              <li key={label}>• {label}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">(none)</p>
        )}
        {qualification.nextQuestion ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Next question: {qualification.nextQuestion}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PlaygroundContextInspector({
  context,
  mode,
  retrievalSummary,
  customerMemoryUsed,
  leadQualification,
}: PlaygroundContextInspectorProps) {
  const title = mode === "used" ? "Context Inspector" : "Available Context";
  const description =
    mode === "used"
      ? "Retrieved Business Brain context and customer memory used for this preview run."
      : "Business Brain data available for playground tests.";

  if (!context) {
    return (
      <DsCard title={title} description={description} className="min-h-[420px]">
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
          Run a test to inspect context usage.
        </div>
      </DsCard>
    );
  }

  return (
    <DsCard title={title} description={description}>
      {retrievalSummary ? (
        <div className="mb-4 rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Retrieved context</p>
          <p className="mt-1">
            Intent: <span className="text-foreground">{retrievalSummary.intent}</span>
          </p>
          <p className="mt-1">
            Products {retrievalSummary.productCount} · Articles{" "}
            {retrievalSummary.articleCount} · Documents {retrievalSummary.documentCount} ·
            Behaviors {retrievalSummary.behaviorCount}
          </p>
          {retrievalSummary.matchedKeywords.length > 0 ? (
            <p className="mt-1">
              Keywords: {retrievalSummary.matchedKeywords.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={cn("max-h-[720px] space-y-5 overflow-y-auto pr-1")}>
        {mode === "used" && leadQualification ? (
          <LeadQualificationSection qualification={leadQualification} />
        ) : null}
        {mode === "used" && customerMemoryUsed ? (
          <CustomerMemoryUsedSection memory={customerMemoryUsed} />
        ) : null}
        {SECTION_ORDER.map((key) => (
          <ContextSection key={key} section={context[key]} />
        ))}
      </div>
    </DsCard>
  );
}

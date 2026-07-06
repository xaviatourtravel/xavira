"use client";

import { Check, Sparkles } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorConversationBubble,
  InspectorEmptyState,
  InspectorKeyValueRow,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { generateIdentityPreview } from "@/modules/business-brain/lib/generate-identity-preview";
import {
  deriveIdentityActiveRules,
  deriveIdentityCompleteness,
  deriveIdentityThinkingConfig,
  formatAiGoalLabels,
} from "@/modules/business-brain/lib/identity-inspector-thinking";
import type { CompanyDnaFormValues } from "@/modules/business-brain/types/company-dna";

type CompanyDnaInspectorProps = {
  values: CompanyDnaFormValues;
};

export function CompanyDnaInspector({ values }: CompanyDnaInspectorProps) {
  const preview = generateIdentityPreview(values);
  const thinking = deriveIdentityThinkingConfig(values);
  const activeRules = deriveIdentityActiveRules(values);
  const goalLabels = formatAiGoalLabels(values.aiGoals);
  const completeness = deriveIdentityCompleteness(values);

  return (
    <BusinessBrainInspector
      title="Live AI Preview"
      subtitle="See how your AI will respond using the current configuration."
      icon={Sparkles}
    >
      <InspectorSection title="Conversation">
        <div className="space-y-3">
          <InspectorConversationBubble role="customer">
            {preview.customerMessage}
          </InspectorConversationBubble>
          <div className="flex justify-center py-0.5 text-muted-foreground" aria-hidden>
            ↓
          </div>
          <InspectorConversationBubble role="ai">{preview.aiReply}</InspectorConversationBubble>
        </div>
      </InspectorSection>

      <InspectorSection title="AI Thinking">
        <div className="space-y-2 rounded-lg bg-muted/35 px-3.5 py-3">
          <InspectorKeyValueRow label="Tone" value={thinking.tone} />
          <InspectorKeyValueRow label="Greeting" value={thinking.greetingStyle} />
          <InspectorKeyValueRow label="Reply Length" value={thinking.replyLength} />
          <InspectorKeyValueRow label="Emoji" value={thinking.emojiUsage} />
          <InspectorKeyValueRow label="Language" value={thinking.language} />
          <InspectorKeyValueRow label="Sales Style" value={thinking.salesStyle} />
        </div>
      </InspectorSection>

      <InspectorSection title="Active Rules">
        {activeRules.length > 0 ? (
          <ul className="space-y-1.5 rounded-lg bg-muted/35 px-3.5 py-3">
            {activeRules.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        ) : (
          <InspectorEmptyState message="Nothing here yet. Add never-rules or AI goals to guide responses." />
        )}
      </InspectorSection>

      <InspectorSection title="AI Goals">
        {goalLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {goalLabels.map((label) => (
              <InspectorBadge key={label} variant="default">
                {label}
              </InspectorBadge>
            ))}
          </div>
        ) : (
          <InspectorEmptyState message="No AI goals selected yet." />
        )}
      </InspectorSection>

      <div className="rounded-lg border border-border bg-background px-3.5 py-3">
        {completeness.complete ? (
          <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
            Identity looks ready.
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              Complete your Identity to improve AI accuracy.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Missing: {completeness.missing.join(", ")}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Updates instantly as you edit. No AI calls.
      </p>
    </BusinessBrainInspector>
  );
}

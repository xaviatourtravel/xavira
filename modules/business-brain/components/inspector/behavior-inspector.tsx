"use client";

import { Shield } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorEmptyState,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import {
  BRAIN_BEHAVIOR_TYPE_LABELS,
  BRAIN_BEHAVIOR_TYPES,
  type BrainBehaviorRecord,
} from "@/modules/business-brain/types/behaviors";

type BehaviorInspectorProps = {
  behaviors: BrainBehaviorRecord[];
};

export function BehaviorInspector({ behaviors }: BehaviorInspectorProps) {
  const contentKey = behaviors.map((item) => `${item.id}:${item.updatedAt}`).join("|");

  return (
    <BusinessBrainInspector
      title="AI Rules"
      subtitle="Active behavior rules that guide AI responses."
      icon={Shield}
      contentKey={contentKey}
    >
      {BRAIN_BEHAVIOR_TYPES.map((type) => {
        const rules = behaviors.filter((item) => item.type === type && item.enabled);
        const configRule = behaviors.find((item) => item.type === type);

        return (
          <InspectorSection key={type} title={BRAIN_BEHAVIOR_TYPE_LABELS[type]}>
            {type === "REPLY_STYLE" || type === "QUALIFICATION_RULE" ? (
              configRule ? (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">{configRule.name}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {configRule.description || "Configured."}
                  </p>
                  <InspectorBadge variant={configRule.enabled ? "success" : "muted"}>
                    {configRule.enabled ? "Active" : "Disabled"}
                  </InspectorBadge>
                </div>
              ) : (
                <InspectorEmptyState message="Not configured yet." />
              )
            ) : rules.length > 0 ? (
              <InspectorList
                items={rules.map((rule) => ({
                  id: rule.id,
                  label: rule.name,
                  detail: rule.description || undefined,
                }))}
              />
            ) : (
              <InspectorEmptyState message="No active rules." />
            )}
          </InspectorSection>
        );
      })}
    </BusinessBrainInspector>
  );
}

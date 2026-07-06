"use client";

import { ShieldCheck } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import type { BrainActionPermissionRecord } from "@/modules/business-brain/types/action-permissions";

type AiPermissionsInspectorProps = {
  permissions: BrainActionPermissionRecord[];
};

export function AiPermissionsInspector({ permissions }: AiPermissionsInspectorProps) {
  const enabled = permissions.filter((item) => item.enabled).length;
  const manualApproval = permissions.filter((item) => item.requireManualApproval).length;
  const disabled = permissions.length - enabled;

  return (
    <BusinessBrainInspector
      title="Permission Overview"
      subtitle="Workspace-wide AI action controls."
      icon={ShieldCheck}
      contentKey={`${enabled}-${manualApproval}-${disabled}`}
    >
      <InspectorSection title="Summary">
        <div className="flex flex-wrap gap-2">
          <InspectorBadge variant="success">{enabled} enabled</InspectorBadge>
          <InspectorBadge variant="warning">{manualApproval} require approval</InspectorBadge>
          <InspectorBadge variant="muted">{disabled} disabled</InspectorBadge>
        </div>
      </InspectorSection>

      <InspectorSection title="How It Works">
        <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <li>Disabled actions are rejected before execution.</li>
          <li>Low-confidence actions are blocked by minimum confidence rules.</li>
          <li>Manual approval keeps actions pending for your team.</li>
        </ul>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

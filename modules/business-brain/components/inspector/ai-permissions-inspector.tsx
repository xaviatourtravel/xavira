"use client";

import { ShieldCheck } from "lucide-react";

import { formatTranslation } from "@/lib/i18n/dictionary";
import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import type { BrainActionPermissionRecord } from "@/modules/business-brain/types/action-permissions";

type AiPermissionsInspectorProps = {
  permissions: BrainActionPermissionRecord[];
};

export function AiPermissionsInspector({ permissions }: AiPermissionsInspectorProps) {
  const { bb } = useBbTranslation();
  const enabled = permissions.filter((item) => item.enabled).length;
  const manualApproval = permissions.filter((item) => item.requireManualApproval).length;
  const disabled = permissions.length - enabled;

  return (
    <BusinessBrainInspector
      title={bb("permissionOverview")}
      subtitle={bb("permissionOverviewSubtitle")}
      icon={ShieldCheck}
      contentKey={`${enabled}-${manualApproval}-${disabled}`}
    >
      <InspectorSection title={bb("permissionSummary")}>
        <div className="flex flex-wrap gap-2">
          <InspectorBadge variant="success">
            {formatTranslation(bb("enabledCount"), { count: enabled })}
          </InspectorBadge>
          <InspectorBadge variant="warning">
            {formatTranslation(bb("requireApprovalCount"), { count: manualApproval })}
          </InspectorBadge>
          <InspectorBadge variant="muted">
            {formatTranslation(bb("disabledCount"), { count: disabled })}
          </InspectorBadge>
        </div>
      </InspectorSection>

      <InspectorSection title={bb("howItWorks")}>
        <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <li>{bb("disabledActionsRejected")}</li>
          <li>{bb("lowConfidenceBlocked")}</li>
          <li>{bb("manualApprovalPending")}</li>
        </ul>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

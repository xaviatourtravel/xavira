"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { MEMORY_KEY_LABELS } from "@/modules/ai/types/memory";
import {
  InspectorEmpty,
  InspectorFooter,
  InspectorRow,
  InspectorRoot,
  InspectorSection,
} from "@/components/ui/inspector";
import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import {
  getQualificationFieldLabelKey,
  getQualificationFieldRows,
} from "@/modules/inbox/lib/build-ai-copilot";

type Customer360TabProps = {
  conversation: OmnichannelConversationDetail;
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function Customer360Tab({ conversation }: Customer360TabProps) {
  const { ti } = useInboxTranslation();
  const lead = conversation.leadContext;
  const qualification = conversation.leadQualification;
  const memory = conversation.conversationMemory;
  const displayName = conversation.customerName || ti("notSet");

  const qualificationRows = useMemo(
    () => getQualificationFieldRows(qualification),
    [qualification],
  );

  const memoryRows = useMemo(() => {
    if (!memory) return [];
    return Object.entries(memory)
      .filter(([, entry]) => entry.memoryValue?.trim())
      .map(([key, entry]) => ({
        key,
        label:
          key in MEMORY_KEY_LABELS
            ? MEMORY_KEY_LABELS[key as keyof typeof MEMORY_KEY_LABELS]
            : key,
        value: entry.memoryValue?.trim() ?? "",
      }));
  }, [memory]);

  const quickActions = useMemo(() => {
    if (!lead) return [];
    const actions: Array<{ href: string; labelKey: InboxKey }> = [
      { href: `/leads/${lead.leadId}`, labelKey: "customer360ViewLead" },
    ];
    if (!lead.nextFollowUp) {
      actions.push({
        href: `/leads/${lead.leadId}`,
        labelKey: "customer360CreateFollowUp",
      });
    }
    return actions;
  }, [lead]);

  return (
    <InspectorRoot className="pb-6">
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <CustomerAvatar
            displayName={displayName}
            avatarUrl={conversation.customerAvatar}
            size="sm"
            channel={
              conversation.channel === "whatsapp"
                ? "whatsapp"
                : conversation.channel === "instagram"
                  ? "instagram"
                  : conversation.channel === "facebook"
                    ? "facebook"
                    : "default"
            }
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-medium text-foreground">{displayName}</h2>
              <OmnichannelChannelBadge channel={conversation.channel} />
            </div>
            <div className="mt-2 space-y-0.5">
              <InspectorRow
                label={ti("whatsappNumber")}
                value={conversation.externalUserId || ti("notSet")}
              />
              <InspectorRow label={ti("leadStatus")} value={conversation.statusLabel} />
              <InspectorRow
                label={ti("assignedSales")}
                value={conversation.assignedUserName || ti("unassigned")}
              />
            </div>
          </div>
        </div>
      </div>

      <InspectorSection title={ti("customer360LookingFor")}>
        {qualificationRows.length > 0 ? (
          <div className="space-y-0.5">
            {qualificationRows.map((field) => (
              <InspectorRow
                key={field.key}
                label={ti(getQualificationFieldLabelKey(field.key))}
                value={field.completed ? field.value || ti("notSet") : ti("notSet")}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{ti("customer360NoOpportunityDesc")}</p>
        )}
      </InspectorSection>

      {memoryRows.length > 0 ? (
        <InspectorSection title={ti("customer360WhatAiKnows")}>
          <div className="space-y-0.5">
            {memoryRows.map((row) => (
              <InspectorRow key={row.key} label={row.label} value={row.value} />
            ))}
          </div>
        </InspectorSection>
      ) : null}

      <InspectorSection title={ti("customer360CrmSummary")} hideDivider={!lead && quickActions.length === 0}>
        {lead ? (
          <div className="space-y-0.5">
            <InspectorRow label={ti("customer360HealthScore")} value={`${lead.healthScore}%`} />
            <InspectorRow label={ti("customer360Source")} value={lead.sourceLabel} />
            <InspectorRow label={ti("customer360Email")} value={lead.email || ti("notSet")} />
            <InspectorRow label={ti("customer360Phone")} value={lead.phone || ti("notSet")} />
            {lead.nextFollowUp ? (
              <InspectorRow
                label={ti("customer360NextFollowUp")}
                value={`${lead.nextFollowUp.title} · ${lead.nextFollowUp.dueDateLabel}`}
              />
            ) : null}
            {lead.budgetIdr != null ? (
              <InspectorRow
                label={ti("fieldBudget")}
                value={formatCurrency(lead.budgetIdr) || ti("notSet")}
              />
            ) : null}
          </div>
        ) : (
          <InspectorEmpty
            title={ti("customer360NoLead")}
            description={ti("customer360NoLeadDesc")}
          />
        )}
      </InspectorSection>

      {quickActions.length > 0 ? (
        <InspectorFooter label={ti("customer360QuickActions")} className="border-t-0 py-3">
          <div className="flex flex-col gap-1">
            {quickActions.map((action) => (
              <Link
                key={action.labelKey}
                href={action.href}
                className="py-1 text-[13px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ti(action.labelKey)}
              </Link>
            ))}
          </div>
        </InspectorFooter>
      ) : null}
    </InspectorRoot>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarPlus,
  ExternalLink,
} from "lucide-react";

import { formatTranslation } from "@/lib/i18n/dictionary";
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
  buildCopilotSummaryFacts,
  getQualificationFieldLabelKey,
  getQualificationFieldRows,
  type CopilotSummaryFact,
} from "@/modules/inbox/lib/build-ai-copilot";

type Customer360TabProps = {
  conversation: OmnichannelConversationDetail;
};

function formatSummaryFact(ti: (key: InboxKey) => string, fact: CopilotSummaryFact) {
  if (fact.key === "budgetMissing") return ti("summaryBudgetMissing");
  const templateKey = {
    destination: "summaryDestination",
    departure: "summaryDeparture",
    passengers: "summaryPassengers",
    budget: "summaryBudget",
    tripType: "summaryTripType",
    specialRequest: "summarySpecialRequest",
  }[fact.key] as InboxKey;
  return formatTranslation(ti(templateKey), { value: fact.value });
}

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
  const summaryFacts = useMemo(
    () => buildCopilotSummaryFacts(conversation),
    [conversation],
  );
  const missingFields = useMemo(
    () => qualificationRows.filter((field) => !field.completed),
    [qualificationRows],
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
    const actions: Array<{ href: string; labelKey: InboxKey; icon: typeof ExternalLink }> = [
      {
        href: `/leads/${lead.leadId}`,
        labelKey: "customer360ViewLead",
        icon: ExternalLink,
      },
    ];
    if (!lead.nextFollowUp) {
      actions.push({
        href: `/leads/${lead.leadId}`,
        labelKey: "customer360CreateFollowUp",
        icon: CalendarPlus,
      });
    }
    return actions;
  }, [lead]);

  return (
    <InspectorRoot className="pb-8">
      <section className="border-b border-border/40 px-4 py-4">
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
      </section>

      <InspectorSection title={ti("customer360LookingFor")}>
        {summaryFacts.length > 0 ? (
          <div className="space-y-0.5">
            {summaryFacts.map((fact) => (
              <InspectorRow
                key={fact.key}
                label={ti(
                  {
                    destination: "fieldDestination",
                    departure: "fieldDeparture",
                    passengers: "fieldPassengerCount",
                    budget: "fieldBudget",
                    budgetMissing: "fieldBudget",
                    tripType: "fieldTripType",
                    specialRequest: "fieldSpecialRequest",
                  }[fact.key] as InboxKey,
                )}
                value={formatSummaryFact(ti, fact)}
              />
            ))}
          </div>
        ) : (
          <InspectorEmpty
            title={ti("summaryEmpty")}
            description={ti("customer360NoOpportunity")}
          />
        )}
      </InspectorSection>

      <InspectorSection title={ti("customer360StillMissing")}>
        {missingFields.length > 0 ? (
          <div className="space-y-0.5">
            {missingFields.map((field) => (
              <InspectorRow
                key={field.key}
                label={ti(getQualificationFieldLabelKey(field.key))}
                value={field.value || ti("notSet")}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{ti("customer360AllCaptured")}</p>
        )}
      </InspectorSection>

      <InspectorSection title={ti("customer360WhatAiKnows")}>
        {memoryRows.length > 0 ? (
          <div className="space-y-0.5">
            {memoryRows.map((row) => (
              <InspectorRow key={row.key} label={row.label} value={row.value} />
            ))}
          </div>
        ) : (
          <InspectorEmpty
            title={ti("customer360NoMemory")}
            description={ti("summaryEmpty")}
          />
        )}
      </InspectorSection>

      <InspectorSection title={ti("customer360CrmSummary")}>
        {lead ? (
          <div className="space-y-0.5">
            <InspectorRow label={ti("customer360LeadStatus")} value={lead.statusLabel} />
            <InspectorRow label={ti("customer360HealthScore")} value={`${lead.healthScore}%`} />
            <InspectorRow label={ti("customer360Source")} value={lead.sourceLabel} />
            <InspectorRow label={ti("customer360Email")} value={lead.email || ti("notSet")} />
            <InspectorRow label={ti("customer360Phone")} value={lead.phone || ti("notSet")} />
            <InspectorRow
              label={ti("customer360AssignedTo")}
              value={lead.assignedToName || ti("unassigned")}
            />
            <InspectorRow
              label={ti("fieldDestination")}
              value={lead.packageInterest || ti("notSet")}
            />
            <InspectorRow
              label={ti("fieldDeparture")}
              value={lead.travelDatePreference || ti("notSet")}
            />
            <InspectorRow
              label={ti("fieldPassengerCount")}
              value={lead.partySize != null ? String(lead.partySize) : ti("notSet")}
            />
            <InspectorRow
              label={ti("fieldBudget")}
              value={formatCurrency(lead.budgetIdr) || ti("notSet")}
            />
            {lead.nextFollowUp ? (
              <InspectorRow
                label={ti("customer360NextFollowUp")}
                value={`${lead.nextFollowUp.title} · ${lead.nextFollowUp.dueDateLabel}`}
              />
            ) : null}
          </div>
        ) : (
          <InspectorEmpty
            title={ti("customer360NoLead")}
            description={ti("customer360NoOpportunity")}
          />
        )}
      </InspectorSection>

      <InspectorFooter label={ti("customer360QuickActions")}>
        {quickActions.length > 0 ? (
          <div className="flex flex-col gap-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.labelKey}
                  href={action.href}
                  className="inline-flex items-center gap-1.5 py-1.5 text-[13px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-3.5 w-3.5 stroke-[1.75]" aria-hidden />
                  {ti(action.labelKey)}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{ti("customer360NoQuickActions")}</p>
        )}
      </InspectorFooter>
    </InspectorRoot>
  );
}

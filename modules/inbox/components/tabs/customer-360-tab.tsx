"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BookOpen,
  CalendarPlus,
  Check,
  ExternalLink,
  MapPin,
  UserRound,
  X,
} from "lucide-react";

import { formatTranslation } from "@/lib/i18n/dictionary";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { MEMORY_KEY_LABELS } from "@/modules/ai/types/memory";
import {
  InspectorEmpty,
  InspectorFooter,
  InspectorHeader,
  InspectorProgress,
  InspectorRoot,
  InspectorRow,
  InspectorSection,
} from "@/components/ui/inspector";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import {
  buildCopilotSummaryFacts,
  getQualificationFieldLabelKey,
  getQualificationFieldRows,
  type CopilotSummaryFact,
} from "@/modules/inbox/lib/build-ai-copilot";
import { cn } from "@/lib/utils";

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
  const completionScore = qualification?.completionScore ?? 0;

  const qualificationRows = useMemo(
    () => getQualificationFieldRows(qualification),
    [qualification],
  );
  const summaryFacts = useMemo(
    () => buildCopilotSummaryFacts(conversation),
    [conversation],
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
    <InspectorRoot>
      <InspectorHeader
        icon={UserRound}
        title={ti("workspacePanelCustomer360Title")}
        description={ti("workspacePanelCustomer360Desc")}
      />

      <InspectorSection icon={UserRound} title={ti("customer360Profile")}>
        <div className="space-y-0.5">
          <InspectorRow label={ti("name")} value={conversation.customerName || ti("notSet")} />
          <InspectorRow
            label={ti("whatsappNumber")}
            value={conversation.externalUserId || ti("notSet")}
          />
          <InspectorRow label={ti("channel")} value={conversation.channelLabel} />
          <InspectorRow label={ti("leadStatus")} value={conversation.statusLabel} />
          <InspectorRow
            label={ti("assignedSales")}
            value={conversation.assignedUserName || ti("unassigned")}
          />
        </div>
      </InspectorSection>

      <InspectorSection
        icon={Check}
        title={ti("leadQualification")}
        action={
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {completionScore}%
          </span>
        }
      >
        <InspectorProgress value={completionScore} />
        <ul className="space-y-1 pt-1">
          {qualificationRows.map((field) => (
            <li
              key={field.key}
              className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-muted/40"
            >
              {field.completed ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              )}
              <span className={cn("font-medium", !field.completed && "text-muted-foreground")}>
                {ti(getQualificationFieldLabelKey(field.key))}
              </span>
              {field.value ? (
                <span className="ml-auto truncate text-xs text-muted-foreground">{field.value}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </InspectorSection>

      <InspectorSection icon={MapPin} title={ti("customer360TravelInterests")}>
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

      <InspectorSection icon={BookOpen} title={ti("customer360Memory")}>
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

      <InspectorSection title={ti("customer360Bookings")}>
        <InspectorEmpty
          title={ti("customer360NoBookings")}
          description={ti("customer360NoBookings")}
        />
      </InspectorSection>

      <InspectorSection title={ti("customer360Payments")}>
        <InspectorEmpty
          title={ti("customer360NoPayments")}
          description={ti("customer360NoPayments")}
        />
      </InspectorSection>

      <InspectorFooter label={ti("customer360QuickActions")}>
        {quickActions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.labelKey}
                  href={action.href}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border/70 bg-transparent px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
                >
                  <Icon className="h-4 w-4 stroke-[1.75] text-muted-foreground" aria-hidden />
                  {ti(action.labelKey)}
                </Link>
              );
            })}
          </div>
        ) : (
          <InspectorEmpty
            title={ti("customer360NoQuickActions")}
            description={ti("customer360NoLead")}
          />
        )}
      </InspectorFooter>
    </InspectorRoot>
  );
}

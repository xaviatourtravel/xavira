import type { CustomerAiSummary } from "@/lib/ai/customer-summary/types";
import type { AISummaryHandoff } from "@/lib/domain/ai-summary";
import type { SalesTakeoverSummaryModel } from "@/modules/inbox/lib/build-sales-takeover-summary";

import type { AISummary } from "../ai-summary";
import type { Customer, CustomerConversationSeed } from "../customer";

export function mapAiSummaryFromCustomerAiSummary(summary: CustomerAiSummary): AISummary {
  const { customerSummary, ...rest } = summary;
  return {
    ...rest,
    summary: customerSummary,
  };
}

export function mapCustomerAiSummaryFromDomain(domainSummary: AISummary): CustomerAiSummary {
  const { summary: summaryText, ...rest } = domainSummary;
  return {
    ...rest,
    customerSummary: summaryText,
  };
}

export function mapAiSummaryHandoffFromSalesTakeover(
  summary: SalesTakeoverSummaryModel,
): AISummaryHandoff {
  return {
    handoffReason: summary.handoffReason,
    destination: summary.destination,
    departure: summary.departure,
    passengerCount: summary.passengerCount,
    budget: summary.budget,
    tripType: summary.tripType,
    specialRequest: summary.specialRequest,
    completionScore: summary.completionScore,
    aiConfidence: summary.aiConfidence,
    lastCustomerMessage: summary.lastCustomerMessage,
    generatedSummary: summary.generatedSummary,
    hasQualificationData: summary.hasQualificationData,
  };
}

export function mapCustomerConversationSeedFromConversation(input: {
  id: string;
  customerName: string;
  customerAvatar: string | null;
  channel: Customer["identity"]["channel"];
  statusLabel: string | null;
  assignedUserName: string | null;
  createdAt: string;
}): CustomerConversationSeed {
  return {
    id: input.id,
    displayName: input.customerName,
    avatarUrl: input.customerAvatar,
    channel: input.channel,
    statusLabel: input.statusLabel,
    assignedOwnerName: input.assignedUserName,
    createdAt: input.createdAt,
  };
}

export function mapAiSummaryLinesFromHandoff(handoff: AISummaryHandoff): string[] {
  const lines: string[] = [];

  if (handoff.generatedSummary?.trim()) {
    lines.push(handoff.generatedSummary.trim());
  }

  if (handoff.destination?.trim()) {
    lines.push(`Destination: ${handoff.destination.trim()}`);
  }

  if (handoff.departure?.trim()) {
    lines.push(`Departure: ${handoff.departure.trim()}`);
  }

  if (handoff.budget?.trim()) {
    lines.push(`Budget: ${handoff.budget.trim()}`);
  }

  if (handoff.passengerCount?.trim()) {
    lines.push(`Travelers: ${handoff.passengerCount.trim()}`);
  }

  return lines;
}

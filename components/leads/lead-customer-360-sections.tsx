import Link from "next/link";
import { ArrowUpRight, CalendarDays, MessageSquare, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { LeadTemperatureBadge } from "@/components/leads/lead-temperature-badge";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";
import type { LeadTemperature } from "@/lib/leads/lead-temperature";
import { cn } from "@/lib/utils";

type LeadDetailHeaderProps = {
  leadId: string;
  fullName: string;
  status: string;
  source: string;
  assignedToLabel: string;
  createdAtLabel: string;
  leadTemperature: {
    value: LeadTemperature;
    isSuggested: boolean;
  };
  conversationHref: string | null;
  hasBooking: boolean;
  createBookingAction?: React.ReactNode;
};

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LeadDetailHeader({
  leadId,
  fullName,
  status,
  source,
  assignedToLabel,
  createdAtLabel,
  leadTemperature,
  conversationHref,
  hasBooking,
  createBookingAction,
}: LeadDetailHeaderProps) {
  return (
    <>
      <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {fullName}
              </h1>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                {formatStatusLabel(status)}
              </span>
              <LeadTemperatureBadge
                value={leadTemperature.value}
                isSuggested={leadTemperature.isSuggested}
              />
            </div>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
              <span>Source: {formatLeadSourceLabel(source)}</span>
              <span>Assigned: {assignedToLabel}</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Created {createdAtLabel}
              </span>
            </div>
          </div>

          <div className="hidden flex-wrap gap-2 lg:flex">
          <Link
            href={`/leads/${leadId}#create-follow-up`}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Plus className="h-3.5 w-3.5" />
            Create follow up
          </Link>

          {conversationHref ? (
            <Link
              href={conversationHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Open conversation
            </Link>
          ) : null}

          {!hasBooking && createBookingAction ? createBookingAction : null}

          <Link
            href={`/customers/${leadId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Customer Workspace
          </Link>

          <Link
            href={`/leads/${leadId}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit lead
          </Link>

          <Link
            href="/leads"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Back
          </Link>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[4.5rem] z-30 flex gap-2 overflow-x-auto border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <Link
          href={`/leads/${leadId}#create-follow-up`}
          className={cn(
            buttonVariants({ size: "sm" }),
            "min-h-[44px] shrink-0 gap-1.5",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Follow up
        </Link>

        {conversationHref ? (
          <Link
            href={conversationHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-h-[44px] shrink-0 gap-1.5",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Inbox
          </Link>
        ) : null}

        {!hasBooking && createBookingAction ? (
          <div className="shrink-0 [&_button]:min-h-[44px] [&_input]:min-h-[44px]">
            {createBookingAction}
          </div>
        ) : null}

        <Link
          href={`/leads/${leadId}/edit`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "min-h-[44px] shrink-0",
          )}
        >
          Edit
        </Link>
      </div>
    </>
  );
}

export function LeadDetailSummaryCard({
  phone,
  email,
  destinationInterest,
  travelDate,
  pax,
  budgetLabel,
  packageInterest,
  leadScore,
  leadScoreBadge,
  intentLevel,
  intentSuggested,
  notes,
}: {
  phone: string;
  email: string;
  destinationInterest: string;
  travelDate: string;
  pax: string;
  budgetLabel: string;
  packageInterest: string;
  leadScore: number;
  leadScoreBadge: string;
  intentLevel: LeadTemperature;
  intentSuggested: boolean;
  notes: string;
}) {
  const items = [
    { label: "Phone", value: phone },
    { label: "Email", value: email },
    { label: "Destination interest", value: destinationInterest },
    { label: "Travel date", value: travelDate },
    { label: "Pax", value: pax },
    { label: "Budget", value: budgetLabel },
    { label: "Package interest", value: packageInterest },
    {
      label: "Lead score",
      value: `${leadScore} · ${leadScoreBadge}`,
    },
    {
      label: "Intent level",
      value: (
        <LeadTemperatureBadge value={intentLevel} isSuggested={intentSuggested} />
      ),
    },
  ];

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Lead summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Core CRM profile and qualification details.
        </p>
      </div>
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <div className="text-sm font-medium text-foreground">{item.value}</div>
          </div>
        ))}
        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {notes}
          </p>
        </div>
      </div>
    </section>
  );
}

export function LeadConversationContextCard({
  channelLabel,
  customerName,
  status,
  lastMessageAtLabel,
  inboxHref,
  messages,
}: {
  channelLabel: string;
  customerName: string;
  status: string;
  lastMessageAtLabel: string;
  inboxHref: string;
  messages: Array<{
    id: string;
    direction: "incoming" | "outgoing";
    text: string;
    createdAtLabel: string;
  }>;
}) {
  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Conversation context
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {channelLabel} · {customerName} · {formatStatusLabel(status)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last activity {lastMessageAtLabel}
          </p>
        </div>
        <Link
          href={inboxHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5",
          )}
        >
          Open in Inbox
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-2 px-5 py-4">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-xl px-3 py-2 text-sm",
                message.direction === "incoming"
                  ? "bg-muted/50 text-foreground"
                  : "bg-primary/10 text-foreground",
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {message.direction === "incoming" ? "Customer" : "Team"} ·{" "}
                {message.createdAtLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {message.text}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No recent messages available.
          </p>
        )}
      </div>
    </section>
  );
}

import type { ReactNode } from "react";
import {
  Bot,
  Calendar,
  CheckCircle2,
  Inbox,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  UserRound,
} from "lucide-react";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { MarketingEyebrow, MarketingH3 } from "@/components/marketing/design-system/typography";
import { cn } from "@/lib/utils";

type ProblemVisualVariant = "inbox" | "crm" | "operations" | "automation";

function InboxScene() {
  return (
    <div className="space-y-3 p-2 sm:p-3">
      <div className="marketing-scene-panel p-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-[var(--marketing-primary)]" aria-hidden />
          <p className="text-sm font-semibold text-[var(--marketing-foreground)]">Unified inbox</p>
        </div>
        <div className="mt-4 space-y-2">
          {["WhatsApp · Sarah Wijaya", "Instagram · Follow-up quote", "Email · Proposal sent"].map(
            (row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-lg bg-[var(--marketing-surface)] px-3 py-2.5 text-sm text-[var(--marketing-muted)]"
              >
                <span>{row}</span>
                <span className="text-xs font-medium text-[var(--marketing-primary)]">Open</span>
              </div>
            ),
          )}
        </div>
      </div>
      <div className="marketing-solution-callout p-4">
        <p className="text-sm text-[var(--marketing-muted)]">
          Assignment, status, and customer context on every thread.
        </p>
      </div>
    </div>
  );
}

function CrmScene() {
  return (
    <div className="space-y-3 p-2 sm:p-3">
      <div className="marketing-scene-panel p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-surface-muted)]">
            <UserRound className="h-5 w-5 text-[var(--marketing-muted)]" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--marketing-foreground)]">Sarah Wijaya</p>
            <p className="text-xs text-[var(--marketing-muted)]">Customer timeline</p>
          </div>
        </div>
        <ol className="mt-5 space-y-3 border-l-2 border-[var(--marketing-border-accent)] pl-4">
          {[
            "Inquiry received via WhatsApp",
            "Qualified by sales team",
            "Proposal shared · awaiting response",
          ].map((event) => (
            <li key={event} className="text-sm text-[var(--marketing-muted)]">
              {event}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function OperationsScene() {
  return (
    <div className="space-y-3 p-2 sm:p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {["Booking", "Task", "Document"].map((column, index) => (
          <div key={column} className="marketing-scene-panel p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--marketing-muted-foreground)]">
              {column}
            </p>
            <div className="mt-3 space-y-2">
              <div className="h-2 rounded bg-[var(--marketing-surface-muted)]" />
              <div
                className={cn(
                  "h-2 rounded",
                  index === 1 ? "w-[70%] bg-[var(--marketing-primary)]/40" : "bg-[var(--marketing-surface-muted)]",
                )}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="marketing-scene-panel flex items-center gap-2 p-4">
        <LayoutGrid className="h-5 w-5 text-[var(--marketing-muted)]" aria-hidden />
        <p className="text-sm text-[var(--marketing-muted)]">
          Operations connected to the same customer record.
        </p>
      </div>
    </div>
  );
}

function AuroraScene() {
  return (
    <div className="space-y-3 p-2 sm:p-3">
      <div className="marketing-scene-panel p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 shrink-0 text-[var(--marketing-muted)]" aria-hidden />
          <p className="text-sm text-[var(--marketing-muted)]">
            Customer asked for a follow-up next week.
          </p>
        </div>
      </div>
      <div className="marketing-solution-callout p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--marketing-accent)]" aria-hidden />
          <Sparkles className="h-4 w-4 text-[var(--marketing-accent-secondary)]" aria-hidden />
          <p className="text-sm font-semibold text-[var(--marketing-primary-muted-foreground)]">
            Aurora draft ready
          </p>
        </div>
        <p className="mt-2 text-sm text-[var(--marketing-muted)]">
          Suggested reply and reminder — waiting for human review.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--marketing-primary)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Approve before sending
        </div>
      </div>
      <div className="marketing-scene-panel flex items-center gap-2 p-3">
        <Calendar className="h-4 w-4 text-[var(--marketing-muted)]" aria-hidden />
        <p className="text-xs text-[var(--marketing-muted)]">Follow-up scheduled · owner assigned</p>
      </div>
    </div>
  );
}

function ProblemVisual({ variant }: { variant: ProblemVisualVariant }) {
  const scenes: Record<ProblemVisualVariant, ReactNode> = {
    inbox: <InboxScene />,
    crm: <CrmScene />,
    operations: <OperationsScene />,
    automation: <AuroraScene />,
  };

  return (
    <div
      className={cn(
        marketingColorClasses.sceneFrame,
        "relative min-h-[280px] sm:min-h-[320px] lg:min-h-[380px]",
      )}
      aria-hidden
    >
      <div className="relative z-[1] h-full marketing-scene-canvas m-3 sm:m-4">
        {scenes[variant]}
      </div>
    </div>
  );
}

export type ProblemSolutionRowProps = {
  problem: string;
  problemDetail: string;
  solution: string;
  solutionDetail: string;
  visualVariant: ProblemVisualVariant;
  reverse?: boolean;
};

export function ProblemSolutionRow({
  problem,
  problemDetail,
  solution,
  solutionDetail,
  visualVariant,
  reverse = false,
}: ProblemSolutionRowProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20",
        reverse && "lg:[&>*:first-child]:order-2",
      )}
    >
      <div className="min-w-0 lg:py-4">
        <MarketingEyebrow className="text-[var(--marketing-error)]/80">
          Problem
        </MarketingEyebrow>
        <MarketingH3 as="h3" className="mt-3">
          {problem}
        </MarketingH3>
        <p className="mt-4 text-base leading-relaxed text-[var(--marketing-muted)] sm:text-lg">
          {problemDetail}
        </p>

        <div className={cn("mt-8 p-5 sm:p-6", marketingColorClasses.solutionCallout)}>
          <p className="text-base font-semibold text-[var(--marketing-primary-muted-foreground)]">
            {solution}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--marketing-muted)] sm:text-base">
            {solutionDetail}
          </p>
        </div>
      </div>

      <ProblemVisual variant={visualVariant} />
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  ListTodo,
  Wallet,
} from "lucide-react";

import type { TodaySummaryMetrics } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TodaySummaryCardsProps = {
  summary: TodaySummaryMetrics;
};

type SummaryCardConfig = {
  key: keyof TodaySummaryMetrics;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  accent: string;
  iconBg: string;
};

const CARDS: SummaryCardConfig[] = [
  {
    key: "openTasks",
    label: "Open Tasks",
    icon: ListTodo,
    href: "#priority-queue",
    accent: "text-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    key: "overdueTasks",
    label: "Overdue",
    icon: AlertCircle,
    href: "#priority-queue",
    accent: "text-red-600",
    iconBg: "bg-red-50 text-red-600",
  },
  {
    key: "unreadConversations",
    label: "Unread Conversations",
    icon: Inbox,
    href: "/inbox",
    accent: "text-primary",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    key: "paymentsToConfirm",
    label: "Payments to Confirm",
    icon: Wallet,
    href: "/bookings",
    accent: "text-amber-600",
    iconBg: "bg-amber-50 text-amber-600",
  },
];

export function TodaySummaryCards({ summary }: TodaySummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = summary[card.key];
        const isInternal = card.href.startsWith("#");

        const content = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  card.iconBg,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {card.key === "overdueTasks" && value > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  <Clock3 className="h-3 w-3" />
                  Action needed
                </span>
              ) : null}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className={cn("mt-1 text-3xl font-semibold tracking-tight", card.accent)}>
                {value}
              </p>
            </div>
          </>
        );

        if (isInternal) {
          return (
            <a
              key={card.key}
              href={card.href}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              {content}
            </a>
          );
        }

        return (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

export function TodayEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Your queue is clear</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        No urgent tasks for today. You&apos;re caught up on customer operations.
      </p>
      <Link
        href="/inbox"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Open Communication Workspace
      </Link>
    </div>
  );
}

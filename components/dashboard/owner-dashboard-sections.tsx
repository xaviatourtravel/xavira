import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Facebook,
  Instagram,
  MessageSquare,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { formatInboxRelativeTime } from "@/components/omnichannel-inbox/inbox-display";
import {
  buildExecutiveSummaryItems,
  buildHeroKpis,
  buildPipelineFunnelCards,
  buildPipelineTakeaway,
  buildTodaysPriorities,
  formatDashboardDate,
  formatRecentActivityTime,
  getActivityFeedMeta,
} from "@/lib/dashboard/owner-executive-insights";
import type { OwnerDashboardMetrics } from "@/lib/dashboard/owner-dashboard-data";
import { cn } from "@/lib/utils";

type DashboardSectionProps = {
  metrics: OwnerDashboardMetrics;
};

function Surface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-card p-6 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/10",
        className,
      )}
    >
      {children}
    </section>
  );
}

const PRIORITY_TONE_CLASSES = {
  urgent:
    "border-amber-200/80 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50",
  action:
    "border-sky-200/80 bg-sky-50/70 hover:border-sky-300 hover:bg-sky-50",
  opportunity:
    "border-emerald-200/80 bg-emerald-50/70 hover:border-emerald-300 hover:bg-emerald-50",
  neutral: "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30",
} as const;

const PRIORITY_COUNT_CLASSES = {
  urgent: "bg-amber-100 text-amber-900",
  action: "bg-sky-100 text-sky-900",
  opportunity: "bg-emerald-100 text-emerald-900",
  neutral: "bg-muted text-muted-foreground",
} as const;

export function OwnerDashboardHeader() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Desklabs
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Action Center
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          What needs your attention today — follow-ups, inbox, and deals in motion.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDashboardDate()}
        </span>
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open Inbox
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/follow-ups/queue"
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80"
        >
          Follow-up Queue
        </Link>
      </div>
    </div>
  );
}

export function OwnerHeroKpiRow({ metrics }: DashboardSectionProps) {
  const items = buildHeroKpis(metrics);

  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const content = (
          <>
            <p
              className={cn(
                "text-3xl font-bold tracking-tight",
                item.emptyState ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {item.value}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{item.label}</p>
            <p
              className={cn(
                "mt-1 text-xs",
                item.tone === "warning" && "font-medium text-amber-700",
                item.tone === "success" && "text-emerald-700",
                item.emptyState && "text-muted-foreground",
                (!item.tone || item.tone === "default") &&
                  !item.emptyState &&
                  "text-muted-foreground",
              )}
            >
              {item.trend}
            </p>
            {item.emptyState && item.href ? (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                View bookings
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </>
        );

        if (item.href && item.emptyState) {
          return (
            <Link key={item.label} href={item.href} className="block">
              <Surface className="p-5 transition-colors hover:bg-muted/20">{content}</Surface>
            </Link>
          );
        }

        return (
          <Surface key={item.label} className="p-5">
            {content}
          </Surface>
        );
      })}
    </div>
  );
}

export function OwnerTodaysPriorities({ metrics }: DashboardSectionProps) {
  const items = buildTodaysPriorities(metrics);
  const urgentCount = items.filter(
    (item) => item.tone === "urgent" || item.tone === "action",
  ).reduce((sum, item) => sum + item.count, 0);

  return (
    <Surface>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Today&apos;s Priorities
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {urgentCount > 0
              ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} need action now`
              : "You're caught up — focus on growth"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group flex items-start justify-between gap-3 rounded-xl border p-4 transition-colors",
              PRIORITY_TONE_CLASSES[item.tone],
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-sm font-bold tabular-nums",
                  PRIORITY_COUNT_CLASSES[item.tone],
                )}
              >
                {item.count}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </Surface>
  );
}

const SUMMARY_ICON_MAP = {
  alert: AlertTriangle,
  message: MessageSquare,
  trend: TrendingUp,
  money: CircleDollarSign,
} as const;

const SUMMARY_TONE_CLASSES = {
  warning: "bg-amber-50 text-amber-800 ring-amber-100",
  info: "bg-sky-50 text-sky-800 ring-sky-100",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  neutral: "bg-muted/50 text-foreground ring-border",
} as const;

export function OwnerExecutiveSummaryCard({ metrics }: DashboardSectionProps) {
  const items = buildExecutiveSummaryItems(metrics);
  const hasEmptyWorkspace =
    metrics.followUpHealth.totalLeads === 0 &&
    metrics.omnichannel.activeConversations === 0 &&
    metrics.inboxMetrics.totalConversations === 0;

  return (
    <Surface className="bg-gradient-to-br from-background via-background to-muted/20">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Quick Snapshot</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Status across follow-ups, inbox, leads, and bookings
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = SUMMARY_ICON_MAP[item.icon];

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 ring-1",
                SUMMARY_TONE_CLASSES[item.tone],
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium leading-snug">{item.text}</p>
            </div>
          );
        })}
      </div>

      {hasEmptyWorkspace ? (
        <div className="mt-5 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Connect Instagram in{" "}
          <Link
            href="/settings?section=integrations"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Settings
          </Link>{" "}
          to start receiving customer conversations.
        </div>
      ) : null}
    </Surface>
  );
}

function ChannelBadge({ channel, label }: { channel: string; label: string }) {
  const isInstagram = channel === "instagram";
  const isFacebook = channel === "facebook";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        isInstagram && "bg-pink-50 text-pink-700",
        isFacebook && "bg-blue-50 text-blue-700",
        !isInstagram && !isFacebook && "bg-muted text-muted-foreground",
      )}
    >
      {isInstagram ? (
        <Instagram className="h-3 w-3" />
      ) : isFacebook ? (
        <Facebook className="h-3 w-3" />
      ) : (
        <MessageSquare className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

function OwnerPipelineFunnelCards({ metrics }: DashboardSectionProps) {
  const cards = buildPipelineFunnelCards(metrics.pipelineFunnel);
  const total = cards.reduce((sum, card) => sum + card.count, 0);
  const takeaway = buildPipelineTakeaway(metrics.pipelineFunnel);

  return (
    <Surface>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Lead Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stage counts and conversion at a glance
          </p>
        </div>
        <Link href="/leads/kanban" className="text-xs font-medium text-primary hover:underline">
          Open pipeline
        </Link>
      </div>

      {total > 0 ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card, index) => (
              <Link
                key={card.key}
                href={`/leads?status=${card.key === "negotiating" ? "negotiating" : card.key}`}
                className="group rounded-xl bg-muted/25 p-4 transition-colors hover:bg-muted/40"
              >
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {card.count}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{card.label}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {card.sharePercent}% of pipeline
                </p>
                {index > 0 ? (
                  <p className="mt-1 text-xs font-medium text-primary">
                    {card.conversionPercent === null
                      ? "No prior stage volume"
                      : `${card.conversionPercent}% from ${cards[index - 1].label.toLowerCase()}`}
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-medium text-primary">Top of funnel</p>
                )}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{takeaway}</p>
        </>
      ) : (
        <div className="mt-5 rounded-xl bg-muted/30 px-4 py-8 text-center">
          <UserPlus className="mx-auto h-5 w-5 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">No leads in pipeline yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Import leads or connect inbox to convert conversations into opportunities.
          </p>
          <Link
            href="/leads/new"
            className="mt-4 inline-flex text-xs font-medium text-primary hover:underline"
          >
            Add your first lead
          </Link>
        </div>
      )}
    </Surface>
  );
}

function OwnerRecentConversationsPanel({ metrics }: DashboardSectionProps) {
  const { recentConversations } = metrics;

  return (
    <Surface>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recent Conversations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest customer messages across channels
          </p>
        </div>
        <Link href="/inbox" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {recentConversations.length > 0 ? (
        <div className="mt-5 divide-y divide-border/60">
          {recentConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={conversation.href}
              className="group flex gap-3 py-4 first:pt-0 last:pb-0 transition-colors hover:bg-muted/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {conversation.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {conversation.customerName}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatInboxRelativeTime(conversation.lastMessageAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {conversation.lastMessagePreview}
                </p>
                <div className="mt-2">
                  <ChannelBadge
                    channel={conversation.channel}
                    label={conversation.channelLabel}
                  />
                </div>
              </div>
              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-muted/30 px-4 py-8 text-center">
          <MessageSquare className="mx-auto h-5 w-5 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">No conversations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect Instagram to start receiving customer conversations.
          </p>
          <Link
            href="/settings?section=integrations"
            className="mt-4 inline-flex text-xs font-medium text-primary hover:underline"
          >
            Connect Instagram
          </Link>
        </div>
      )}
    </Surface>
  );
}

function OwnerActivityTimeline({ metrics }: DashboardSectionProps) {
  const { recentActivity } = metrics;

  return (
    <Surface>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest movement across inbox, leads, and bookings
          </p>
        </div>
        <Clock3 className="h-4 w-4 text-muted-foreground" />
      </div>

      {recentActivity.length > 0 ? (
        <div className="mt-5 space-y-0">
          {recentActivity.slice(0, 6).map((item, index) => {
            const meta = getActivityFeedMeta(item);
            const isLast = index === recentActivity.slice(0, 6).length - 1;

            return (
              <div key={item.id} className="relative flex gap-3 pb-5">
                {!isLast ? (
                  <span className="absolute left-[11px] top-6 h-[calc(100%-8px)] w-px bg-border" />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full ring-4 ring-card",
                    meta.tone === "sky" && "bg-sky-100",
                    meta.tone === "violet" && "bg-violet-100",
                    meta.tone === "emerald" && "bg-emerald-100",
                    meta.tone === "amber" && "bg-amber-100",
                    meta.tone === "neutral" && "bg-muted",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {item.label}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{meta.category}</span>
                    <span aria-hidden>·</span>
                    <span>{formatRecentActivityTime(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">No recent activity</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Activity will appear as your team uses Desklabs.
          </p>
        </div>
      )}
    </Surface>
  );
}

export function OwnerPerformanceSection({ metrics }: DashboardSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <OwnerPipelineFunnelCards metrics={metrics} />
      <div className="space-y-6">
        <OwnerRecentConversationsPanel metrics={metrics} />
        <OwnerActivityTimeline metrics={metrics} />
      </div>
    </div>
  );
}

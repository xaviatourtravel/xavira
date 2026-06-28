import type { ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  BookOpen,
  CreditCard,
  ListTodo,
  MessageSquare,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

function MockShell({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70",
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function PlatformDashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl min-w-0">
      <div
        aria-hidden
        className="absolute -inset-3 animate-pulse rounded-[2rem] bg-gradient-to-br from-emerald-100/40 via-white to-slate-100 blur-2xl [animation-duration:6s] sm:-inset-4"
      />

      <div className="relative overflow-hidden rounded-[1.5rem] bg-white shadow-[0_28px_90px_-28px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/70 sm:rounded-[1.75rem]">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          </div>
          <div className="mx-auto truncate rounded-md bg-white px-2 py-1 text-[10px] text-slate-500 shadow-sm sm:px-3 sm:text-[11px]">
            app.desklabs.id / today
          </div>
        </div>

        <div className="grid gap-3 bg-slate-50/40 p-3 sm:grid-cols-12 sm:p-4">
          <div className="space-y-3 sm:col-span-4">
            <MockShell title="Priority Queue">
              <div className="space-y-2">
                <div className="rounded-lg bg-orange-50 px-2 py-1.5 ring-1 ring-orange-100">
                  <p className="text-xs font-medium text-slate-900">Reply customer</p>
                  <p className="text-[10px] text-slate-500">High · Due today</p>
                </div>
                <div className="rounded-lg bg-white px-2 py-1.5 ring-1 ring-slate-100">
                  <p className="text-xs font-medium text-slate-900">Confirm payment</p>
                  <p className="text-[10px] text-slate-500">Normal</p>
                </div>
              </div>
            </MockShell>
            <MockShell title="Customer">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Users className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Sarah Wijaya</p>
                  <p className="text-[10px] text-slate-500">Qualified · Enterprise</p>
                </div>
              </div>
            </MockShell>
          </div>

          <div className="space-y-3 sm:col-span-5">
            <MockShell title="Communication">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    “Kami ingin demo platform untuk workflow sales dan support.”
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">WhatsApp · 3m ago</p>
                </div>
              </div>
            </MockShell>
            <MockShell title="AI Summary">
              <div className="flex items-start gap-2">
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs leading-relaxed text-slate-600">
                  High intent. Recommend scheduling demo and sharing enterprise
                  workflow overview.
                </p>
              </div>
            </MockShell>
            <MockShell title="Sales Pipeline">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Enterprise Plan</span>
                <span className="font-medium text-slate-900">Proposal</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[70%] rounded-full bg-emerald-600" />
              </div>
            </MockShell>
          </div>

          <div className="space-y-3 sm:col-span-3">
            <MockShell title="Finance">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Invoice pending
              </div>
            </MockShell>
            <MockShell title="Knowledge">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <BookOpen className="h-4 w-4 text-slate-500" />
                SOP: Demo flow
              </div>
            </MockShell>
            <div className="rounded-xl bg-emerald-50/90 p-3 ring-1 ring-emerald-200/70">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-900">
                <Zap className="h-3.5 w-3.5" />
                Next action
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-800">
                Schedule demo + send proposal link
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformCapabilityPreview({ id }: { id: string }) {
  const previews: Record<string, ReactNode> = {
    communication: (
      <MockShell title="Inbox">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <p className="text-xs text-slate-600">3 channels · 1 workspace</p>
        </div>
      </MockShell>
    ),
    customer: (
      <MockShell title="Customer 360">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-700" />
          <p className="text-xs text-slate-600">Timeline · Bookings · Notes</p>
        </div>
      </MockShell>
    ),
    tasks: (
      <MockShell title="Today">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-slate-700" />
          <p className="text-xs text-slate-600">7 open · 2 urgent</p>
        </div>
      </MockShell>
    ),
    sales: (
      <MockShell title="Pipeline">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-700" />
          <p className="text-xs text-slate-600">Negotiating · Rp 48M</p>
        </div>
      </MockShell>
    ),
    finance: (
      <MockShell title="Payments">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-slate-700" />
          <p className="text-xs text-slate-600">DP paid · Balance due</p>
        </div>
      </MockShell>
    ),
    knowledge: (
      <MockShell title="Knowledge Hub">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-700" />
          <p className="text-xs text-slate-600">SOP · FAQ · Scripts</p>
        </div>
      </MockShell>
    ),
    automation: (
      <MockShell title="Automation">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-slate-700" />
          <p className="text-xs text-slate-600">Task rules · Reminders</p>
        </div>
      </MockShell>
    ),
    ai: (
      <MockShell title="AI Insights">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-emerald-600" />
          <p className="text-xs text-slate-600">Summary · Next action</p>
        </div>
      </MockShell>
    ),
  };

  return (
    <div className="rounded-2xl bg-[linear-gradient(to_bottom,#f8fafc,#ffffff)] p-5 ring-1 ring-slate-200/70">
      {previews[id] ?? previews.communication}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <ArrowRight className="h-3.5 w-3.5" />
        Live product workflow preview
      </div>
    </div>
  );
}

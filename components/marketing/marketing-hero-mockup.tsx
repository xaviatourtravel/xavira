import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Sparkles,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

function MockCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function MarketingHeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl min-w-0">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[rgba(45,115,213,0.12)] via-white to-slate-100 blur-2xl sm:-inset-4"
      />

      <div className="relative overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/70 sm:rounded-[1.75rem]">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
          <div className="mx-auto truncate rounded-md bg-white px-2 py-1 text-[10px] text-slate-500 shadow-sm sm:px-3 sm:text-[11px]">
            app.desklabs.id / workspace
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-[1.1fr_0.9fr] sm:p-5">
          <div className="space-y-3">
            <MockCard title="Incoming Message">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-primary-muted)] text-[var(--marketing-primary)]">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    Sarah Wijaya
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Halo, saya ingin konsultasi paket enterprise. Apakah tim Anda
                    bisa follow up hari ini?
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    WhatsApp · 2 menit lalu
                  </p>
                </div>
              </div>
            </MockCard>

            <MockCard title="Customer Context">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <UserRound className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    Sarah Wijaya
                  </p>
                  <p className="text-xs text-slate-500">High intent · Sales team</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-slate-600">
                  Channel: WhatsApp
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-slate-600">
                  Stage: Qualified
                </div>
              </div>
            </MockCard>

            <MockCard title="AI Summary">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-accent)]" />
                <p className="text-sm leading-relaxed text-slate-600">
                  Customer siap lanjut, membutuhkan proposal dan timeline
                  implementasi minggu depan.
                </p>
              </div>
            </MockCard>
          </div>

          <div className="space-y-3">
            <MockCard title="Task Generated">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">Reply customer</p>
                  <p className="text-xs text-slate-500">Priority: High · Due today</p>
                </div>
                <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                  Urgent
                </span>
              </div>
            </MockCard>

            <MockCard title="Sales Pipeline">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-slate-500">Enterprise Plan</span>
                  <span className="shrink-0 font-medium text-slate-900">Proposal</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[68%] rounded-full bg-[var(--marketing-primary)]" />
                </div>
                <p className="text-xs text-slate-500">Est. value Rp 48.000.000</p>
              </div>
            </MockCard>

            <MockCard title="Payment Status">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate text-sm text-slate-700">
                    Invoice pending
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Review
                </span>
              </div>
            </MockCard>

            <div className="rounded-xl bg-[var(--marketing-primary-muted)]/80 p-3 ring-1 ring-[var(--marketing-border-accent)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--marketing-primary-muted-foreground)]">
                <Bot className="h-4 w-4" />
                Next Best Action
              </div>
              <p className="mt-2 text-sm text-[var(--marketing-primary-hover)]">
                Kirim proposal singkat dan jadwalkan call follow up dalam satu
                balasan.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--marketing-primary)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready for review
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

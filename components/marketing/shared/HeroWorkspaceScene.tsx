import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ListTodo,
  MessageSquare,
  Sparkles,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

function SceneCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("marketing-scene-panel p-4 sm:p-5", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--marketing-muted-foreground)]">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function HeroWorkspaceScene({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full min-w-0 lg:min-h-[520px]", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] marketing-dark-band-glow opacity-80 blur-3xl sm:-inset-8"
      />

      <div className="marketing-scene-frame relative p-4 sm:p-6 lg:p-7">
        <div className="relative z-[1] flex items-center gap-3 border-b border-[var(--marketing-border-subtle)] pb-4">
          <div className="flex gap-2" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-[var(--marketing-border-strong)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--marketing-border-strong)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--marketing-accent-secondary)] opacity-70" />
          </div>
          <div className="mx-auto rounded-md bg-[var(--marketing-surface)] px-4 py-1.5 text-xs text-[var(--marketing-muted)]">
            app.desklabs.id / workspace
          </div>
        </div>

        <div className="relative z-[1] mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-5">
          <div className="space-y-4">
            <SceneCard title="Communication Workspace">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-primary-muted)] text-[var(--marketing-primary)]">
                  <MessageSquare className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-[var(--marketing-foreground)]">
                    Sarah Wijaya
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--marketing-muted)]">
                    Halo, saya ingin konsultasi paket enterprise. Apakah tim Anda bisa
                    follow up hari ini?
                  </p>
                  <p className="mt-2 text-xs text-[var(--marketing-muted-foreground)]">
                    WhatsApp · 2 menit lalu
                  </p>
                </div>
              </div>
            </SceneCard>

            <SceneCard title="Customer Context">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-surface-muted)]">
                  <UserRound className="h-5 w-5 text-[var(--marketing-muted)]" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--marketing-foreground)]">
                    Sarah Wijaya
                  </p>
                  <p className="text-xs text-[var(--marketing-muted)]">
                    High intent · Sales team
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--marketing-muted)]">
                <div className="rounded-lg bg-[var(--marketing-surface)] px-3 py-2">
                  Channel: WhatsApp
                </div>
                <div className="rounded-lg bg-[var(--marketing-surface)] px-3 py-2">
                  Stage: Qualified
                </div>
              </div>
            </SceneCard>
          </div>

          <div className="space-y-4">
            <SceneCard title="Operations">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--marketing-foreground)]">
                    Reply customer
                  </p>
                  <p className="mt-1 text-xs text-[var(--marketing-muted)]">
                    Priority: High · Due today
                  </p>
                </div>
                <ListTodo className="h-5 w-5 shrink-0 text-[var(--marketing-warning)]" aria-hidden />
              </div>
            </SceneCard>

            <SceneCard title="Pipeline">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--marketing-muted)]">
                  <span>Enterprise Plan</span>
                  <span className="font-medium text-[var(--marketing-foreground)]">Proposal</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--marketing-surface-muted)]">
                  <div className="h-full w-[68%] rounded-full bg-[var(--marketing-primary)]" />
                </div>
              </div>
            </SceneCard>

            <div className="marketing-solution-callout p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--marketing-primary-muted-foreground)]">
                <Sparkles className="h-4 w-4 text-[var(--marketing-accent)]" aria-hidden />
                Aurora summary
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--marketing-muted)]">
                Customer siap lanjut. Siapkan proposal dan jadwalkan call follow up minggu
                depan.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--marketing-primary)]">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Ready for review
                <ArrowRight className="h-4 w-4" aria-hidden />
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute bottom-6 right-6 hidden rounded-xl bg-[var(--marketing-elevated-surface)] px-4 py-3 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-accent)] lg:block"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--marketing-foreground)]">
            <CreditCard className="h-4 w-4 text-[var(--marketing-muted)]" />
            Invoice pending review
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroWorkspaceSceneCompact({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full", className)} aria-label="Desklabs workspace preview">
      <HeroWorkspaceScene />
    </div>
  );
}

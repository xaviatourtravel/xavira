import type { ReactNode } from "react";
import {
  Briefcase,
  Building2,
  GraduationCap,
  HeartPulse,
  MessageSquare,
  Plane,
} from "lucide-react";

import { cn } from "@/lib/utils";

type IndustryPreviewId = "travel" | "education" | "healthcare" | "property" | "agency";

function SceneBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="marketing-scene-panel p-3 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--marketing-muted-foreground)]">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const previews: Record<IndustryPreviewId, ReactNode> = {
  travel: (
    <div className="grid gap-3 sm:grid-cols-2">
      <SceneBlock title="Quotation">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-primary)]" aria-hidden />
          <p className="text-sm leading-snug text-[var(--marketing-muted)]">
            Bali 5D4N · 4 pax · departure 12 Aug
          </p>
        </div>
      </SceneBlock>
      <SceneBlock title="Booking">
        <p className="text-sm font-medium text-[var(--marketing-foreground)]">BK-2841</p>
        <p className="mt-1 text-xs text-[var(--marketing-muted)]">Confirmed · Payment pending</p>
      </SceneBlock>
    </div>
  ),
  education: (
    <div className="grid gap-3 sm:grid-cols-2">
      <SceneBlock title="Admission inquiry">
        <div className="flex items-start gap-2">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-muted)]" aria-hidden />
          <p className="text-sm leading-snug text-[var(--marketing-muted)]">
            Grade 7 intake · parent follow-up
          </p>
        </div>
      </SceneBlock>
      <SceneBlock title="Enrollment">
        <p className="text-sm font-medium text-[var(--marketing-foreground)]">Docs review</p>
        <p className="mt-1 text-xs text-[var(--marketing-muted)]">Interview scheduled Thu</p>
      </SceneBlock>
    </div>
  ),
  healthcare: (
    <div className="grid gap-3 sm:grid-cols-2">
      <SceneBlock title="Appointment">
        <div className="flex items-start gap-2">
          <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-muted)]" aria-hidden />
          <p className="text-sm leading-snug text-[var(--marketing-muted)]">
            Dental check · first visit · reminder sent
          </p>
        </div>
      </SceneBlock>
      <SceneBlock title="Follow-up">
        <p className="text-sm font-medium text-[var(--marketing-foreground)]">Intake complete</p>
        <p className="mt-1 text-xs text-[var(--marketing-muted)]">Non-clinical coordination only</p>
      </SceneBlock>
    </div>
  ),
  property: (
    <div className="grid gap-3 sm:grid-cols-2">
      <SceneBlock title="Lead">
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-muted)]" aria-hidden />
          <p className="text-sm leading-snug text-[var(--marketing-muted)]">
            2BR tower A · budget 1.2B · hot lead
          </p>
        </div>
      </SceneBlock>
      <SceneBlock title="Viewing">
        <p className="text-sm font-medium text-[var(--marketing-foreground)]">Sat 10:00</p>
        <p className="mt-1 text-xs text-[var(--marketing-muted)]">Agent assigned · negotiation prep</p>
      </SceneBlock>
    </div>
  ),
  agency: (
    <div className="grid gap-3 sm:grid-cols-2">
      <SceneBlock title="Proposal">
        <div className="flex items-start gap-2">
          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-muted)]" aria-hidden />
          <p className="text-sm leading-snug text-[var(--marketing-muted)]">
            Brand launch Q3 · scope sent
          </p>
        </div>
      </SceneBlock>
      <SceneBlock title="Project">
        <p className="text-sm font-medium text-[var(--marketing-foreground)]">Invoice draft</p>
        <p className="mt-1 text-xs text-[var(--marketing-muted)]">Awaiting client approval</p>
      </SceneBlock>
    </div>
  ),
};

const icons: Record<IndustryPreviewId, typeof Plane> = {
  travel: Plane,
  education: GraduationCap,
  healthcare: HeartPulse,
  property: Building2,
  agency: Briefcase,
};

export function IndustryUiPreview({
  industryId,
  className,
  size = "default",
}: {
  industryId: IndustryPreviewId;
  className?: string;
  size?: "default" | "large";
}) {
  const Icon = icons[industryId];

  return (
    <div
      className={cn(
        "marketing-scene-canvas p-4 sm:p-5",
        size === "large" && "min-h-[180px] sm:min-h-[200px]",
        className,
      )}
      aria-hidden
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--marketing-foreground)] text-[var(--marketing-background)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium text-[var(--marketing-muted-foreground)]">
          Desklabs workspace
        </span>
      </div>
      {previews[industryId]}
    </div>
  );
}

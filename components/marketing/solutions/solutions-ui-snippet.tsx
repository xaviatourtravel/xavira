import type { ReactNode } from "react";
import {
  BookOpen,
  Building2,
  Calendar,
  CreditCard,
  GraduationCap,
  HeartPulse,
  MapPin,
  MessageSquare,
  Package,
  ShoppingBag,
  Briefcase,
  Users,
} from "lucide-react";

import type { SolutionIndustryId } from "@/lib/marketing/solutions-content";
import { cn } from "@/lib/utils";

function SnippetShell({
  title,
  children,
  accent = "slate",
}: {
  title: string;
  children: ReactNode;
  accent?: "brand" | "slate";
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70",
        accent === "brand" && "ring-[var(--marketing-border-accent)]",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const industrySnippets: Record<SolutionIndustryId, ReactNode> = {
  travel: (
    <div className="grid gap-2 sm:grid-cols-2">
      <SnippetShell title="Inquiry">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-primary)]" />
          <p className="text-xs text-slate-600">Bali 5D4N · 4 pax · April</p>
        </div>
      </SnippetShell>
      <SnippetShell title="Booking">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Package className="h-4 w-4 text-slate-500" />
          BK-2841 · Confirmed
        </div>
      </SnippetShell>
      <SnippetShell title="Participants">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Users className="h-4 w-4 text-slate-500" />
          4 travelers · docs complete
        </div>
      </SnippetShell>
      <SnippetShell title="Payment" accent="brand">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CreditCard className="h-4 w-4 text-[var(--marketing-primary)]" />
          DP paid · balance due
        </div>
      </SnippetShell>
    </div>
  ),
  education: (
    <div className="grid gap-2 sm:grid-cols-2">
      <SnippetShell title="Student Inquiry">
        <div className="flex items-start gap-2">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          <p className="text-xs text-slate-600">Grade 7 admission · open house</p>
        </div>
      </SnippetShell>
      <SnippetShell title="Admission">
        <p className="text-xs text-slate-700">Interview scheduled · docs pending</p>
      </SnippetShell>
      <SnippetShell title="Parent Chat">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          WhatsApp · fee reminder
        </div>
      </SnippetShell>
      <SnippetShell title="Payment">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CreditCard className="h-4 w-4 text-slate-500" />
          Enrollment fee · partial
        </div>
      </SnippetShell>
    </div>
  ),
  property: (
    <div className="grid gap-2 sm:grid-cols-2">
      <SnippetShell title="Lead">
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          <p className="text-xs text-slate-600">2BR tower A · budget 1.2B</p>
        </div>
      </SnippetShell>
      <SnippetShell title="Site Visit">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <MapPin className="h-4 w-4 text-slate-500" />
          Sat 10:00 · agent assigned
        </div>
      </SnippetShell>
      <SnippetShell title="Pipeline">
        <p className="text-xs text-slate-700">Negotiation · unit 12A reserved</p>
      </SnippetShell>
      <SnippetShell title="Milestone">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CreditCard className="h-4 w-4 text-slate-500" />
          Booking fee received
        </div>
      </SnippetShell>
    </div>
  ),
  healthcare: (
    <div className="grid gap-2 sm:grid-cols-2">
      <SnippetShell title="Patient Inquiry">
        <div className="flex items-start gap-2">
          <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          <p className="text-xs text-slate-600">Dental check · first visit</p>
        </div>
      </SnippetShell>
      <SnippetShell title="Appointment">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Calendar className="h-4 w-4 text-slate-500" />
          Follow-up · Thu 14:00
        </div>
      </SnippetShell>
      <SnippetShell title="Package">
        <p className="text-xs text-slate-700">Whitening bundle · 3 sessions</p>
      </SnippetShell>
      <SnippetShell title="Payment">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CreditCard className="h-4 w-4 text-slate-500" />
          Installment 2/3 paid
        </div>
      </SnippetShell>
    </div>
  ),
  agency: (
    <div className="grid gap-2 sm:grid-cols-2">
      <SnippetShell title="Client Inquiry">
        <div className="flex items-start gap-2">
          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          <p className="text-xs text-slate-600">Brand launch · Q3 campaign</p>
        </div>
      </SnippetShell>
      <SnippetShell title="Proposal">
        <p className="text-xs text-slate-700">Sent · awaiting feedback</p>
      </SnippetShell>
      <SnippetShell title="Onboarding">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Users className="h-4 w-4 text-slate-500" />
          Kickoff task assigned
        </div>
      </SnippetShell>
      <SnippetShell title="Payment">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CreditCard className="h-4 w-4 text-slate-500" />
          50% upfront received
        </div>
      </SnippetShell>
    </div>
  ),
  retail: (
    <div className="grid gap-2 sm:grid-cols-2">
      <SnippetShell title="Inquiry">
        <div className="flex items-start gap-2">
          <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          <p className="text-xs text-slate-600">Size M restock · delivery ETA</p>
        </div>
      </SnippetShell>
      <SnippetShell title="Order Support">
        <p className="text-xs text-slate-700">ORD-9921 · exchange requested</p>
      </SnippetShell>
      <SnippetShell title="History">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Users className="h-4 w-4 text-slate-500" />
          3 orders · loyal segment
        </div>
      </SnippetShell>
      <SnippetShell title="Follow-up">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          Repeat purchase nudge
        </div>
      </SnippetShell>
    </div>
  ),
};

export function SolutionsUiSnippet({ industryId }: { industryId: SolutionIndustryId }) {
  return (
    <div className="rounded-2xl bg-[linear-gradient(to_bottom,#f8fafc,#ffffff)] p-5 ring-1 ring-slate-200/70">
      {industrySnippets[industryId]}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <BookOpen className="h-3.5 w-3.5" />
        Industry workflow preview
      </div>
    </div>
  );
}

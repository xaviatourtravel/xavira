import Link from "next/link";
import {
  Briefcase,
  Building2,
  GraduationCap,
  HeartPulse,
  Plane,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { SolutionIndustryId } from "@/lib/marketing/solutions-content";
import { cn } from "@/lib/utils";

const INDUSTRY_ICONS: Record<SolutionIndustryId, LucideIcon> = {
  travel: Plane,
  education: GraduationCap,
  property: Building2,
  healthcare: HeartPulse,
  agency: Briefcase,
  retail: ShoppingBag,
};

function StatusBadge({ status }: { status: "available" | "coming_soon" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        status === "available"
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
      )}
    >
      {status === "available" ? "Available" : "Coming Soon"}
    </span>
  );
}

export type SolutionsIndustryCardProps = {
  id: SolutionIndustryId;
  name: string;
  shortDescription: string;
  workflows: string[];
  status: "available" | "coming_soon";
  exploreHref?: string;
  exploreLabel?: string;
  compact?: boolean;
};

export function SolutionsIndustryCard({
  id,
  name,
  shortDescription,
  workflows,
  status,
  exploreHref,
  exploreLabel,
  compact = false,
}: SolutionsIndustryCardProps) {
  const Icon = INDUSTRY_ICONS[id];
  const isAvailable = status === "available" && exploreHref;

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:ring-emerald-200/80 sm:p-6",
        status === "available" &&
          "bg-[linear-gradient(to_bottom,#ffffff,#f8fafc)] ring-emerald-200/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm",
            status === "available" ? "bg-emerald-700" : "bg-slate-900",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <StatusBadge status={status} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-950">{name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{shortDescription}</p>

      <ul className="mt-4 flex-1 space-y-2">
        {(compact ? workflows.slice(0, 4) : workflows).map((workflow) => (
          <li key={workflow} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            {workflow}
          </li>
        ))}
        {compact && workflows.length > 4 ? (
          <li className="text-xs text-slate-400">+{workflows.length - 4} more workflows</li>
        ) : null}
      </ul>

      <div className="mt-6">
        {isAvailable ? (
          <Link
            href={exploreHref}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full bg-emerald-700 hover:bg-emerald-800",
            )}
          >
            {exploreLabel ?? "Explore Solution"}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full cursor-not-allowed opacity-60",
            )}
          >
            {exploreLabel ?? "Coming Soon"}
          </button>
        )}
      </div>
    </article>
  );
}

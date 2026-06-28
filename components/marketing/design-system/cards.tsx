import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { marketingAnimation } from "@/components/marketing/design-system/tokens/animation";
import { marketingRadius, marketingShadow } from "@/components/marketing/design-system/tokens/radius";
import { cn } from "@/lib/utils";

type MarketingCardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: boolean;
};

function MarketingCardBase({
  children,
  className,
  interactive = false,
  accent = false,
}: MarketingCardProps) {
  return (
    <article
      className={cn(
        marketingRadius.lg,
        "bg-white p-5",
        marketingShadow.card,
        "ring-1 ring-slate-200/70",
        accent && "bg-[linear-gradient(to_bottom,#ffffff,#f8fafc)] ring-emerald-200/50",
        interactive && marketingAnimation.hoverLift,
        marketingAnimation.respectMotion,
        "sm:p-6",
        className,
      )}
    >
      {children}
    </article>
  );
}

/** Platform module / capability card */
export function MarketingPlatformCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <MarketingCardBase interactive className={className}>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center text-white",
          marketingRadius.icon,
          "bg-slate-950",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </MarketingCardBase>
  );
}

/** Industry solution pack card */
export function MarketingIndustryCard({
  icon: Icon,
  title,
  description,
  workflows,
  status,
  footer,
  className,
  accent = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  workflows: string[];
  status?: ReactNode;
  footer?: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <MarketingCardBase
      interactive
      accent={accent}
      className={cn("flex h-full flex-col", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center text-white",
            marketingRadius.icon,
            accent ? "bg-emerald-700" : "bg-slate-900",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {status}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <ul className="mt-4 flex-1 space-y-2">
        {workflows.map((workflow) => (
          <li key={workflow} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            {workflow}
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </MarketingCardBase>
  );
}

/** Generic feature highlight card */
export function MarketingFeatureCard({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <MarketingCardBase interactive className={className}>
      {icon ? <div className="mb-4">{icon}</div> : null}
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
    </MarketingCardBase>
  );
}

/** Metric / stat highlight */
export function MarketingStatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <MarketingCardBase className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </MarketingCardBase>
  );
}

/** Side-by-side comparison column card */
export function MarketingComparisonCard({
  title,
  items,
  tone = "neutral",
  className,
}: {
  title: string;
  items: ReactNode[];
  tone?: "neutral" | "accent";
  className?: string;
}) {
  return (
    <MarketingCardBase
      className={cn(
        tone === "neutral" && "bg-slate-50/80",
        tone === "accent" && "shadow-md ring-emerald-200/70",
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <ul className="mt-5 space-y-3">{items}</ul>
    </MarketingCardBase>
  );
}

/** FAQ accordion-style card (static; expand logic can wrap later) */
export function MarketingFaqCard({
  question,
  answer,
  className,
}: {
  question: string;
  answer: string;
  className?: string;
}) {
  return (
    <MarketingCardBase className={className}>
      <h3 className="text-base font-semibold text-slate-950">{question}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{answer}</p>
    </MarketingCardBase>
  );
}

/** Inline CTA card for mid-page conversion */
export function MarketingCtaCard({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <MarketingCardBase
      accent
      className={cn("text-center", className)}
    >
      <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        {actions}
      </div>
    </MarketingCardBase>
  );
}

export { MarketingCardBase };

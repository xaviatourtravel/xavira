import type { ReactNode } from "react";
import Link from "next/link";

import { MarketingLocaleProvider } from "@/components/marketing/marketing-locale-provider";
import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import {
  marketingContainerClass,
  marketingSpacing,
} from "@/components/marketing/design-system/tokens/spacing";
import {
  MarketingBodyLarge,
  MarketingEyebrow,
  MarketingH1,
  MarketingH2,
} from "@/components/marketing/design-system/typography";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "muted" | "dark";

const toneClass: Record<SectionTone, string> = {
  default: marketingColorClasses.bgPage,
  muted: marketingColorClasses.bgMuted,
  dark: marketingColorClasses.bgDark,
};

export function MarketingContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(marketingContainerClass, className)}>{children}</div>;
}

export type MarketingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  tone?: SectionTone;
};

export function MarketingSection({
  id,
  children,
  className,
  containerClassName,
  tone = "default",
}: MarketingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        marketingSpacing.scrollMargin,
        marketingSpacing.section.combined,
        toneClass[tone],
        className,
      )}
    >
      <MarketingContainer className={containerClassName}>{children}</MarketingContainer>
    </section>
  );
}

export type MarketingSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleAs?: "h1" | "h2";
};

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  titleAs = "h2",
}: MarketingSectionHeaderProps) {
  const TitleComponent = titleAs === "h1" ? MarketingH1 : MarketingH2;

  return (
    <div
      className={cn(
        "marketing-prose mx-auto",
        align === "center" && "text-center",
        className,
      )}
    >
      {eyebrow ? <MarketingEyebrow>{eyebrow}</MarketingEyebrow> : null}
      <TitleComponent className={eyebrow ? "mt-3" : undefined}>{title}</TitleComponent>
      {description ? (
        <MarketingBodyLarge className="mt-4">{description}</MarketingBodyLarge>
      ) : null}
    </div>
  );
}

export type MarketingHeroSectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  visual?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function MarketingHeroSection({
  eyebrow,
  title,
  description,
  actions,
  visual,
  align = "left",
  className,
}: MarketingHeroSectionProps) {
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        marketingColorClasses.bgPage,
        marketingSpacing.hero.combined,
        className,
      )}
    >
      <div
        className={cn(
          marketingContainerClass,
          "grid items-center gap-10 sm:gap-12",
          visual && "lg:grid-cols-[1.05fr_0.95fr] lg:gap-16",
        )}
      >
        <div className={cn("min-w-0", centered ? "marketing-prose mx-auto text-center" : "max-w-2xl")}>
          {eyebrow ? <MarketingEyebrow>{eyebrow}</MarketingEyebrow> : null}
          <MarketingH1 className={eyebrow ? "mt-5 sm:mt-6" : undefined}>
            {title}
          </MarketingH1>
          <MarketingBodyLarge className="mt-4 sm:mt-5">{description}</MarketingBodyLarge>
          {actions ? (
            <div
              className={cn(
                "mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center",
                centered && "sm:justify-center",
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
        {visual ? <div className="min-w-0">{visual}</div> : null}
      </div>
    </section>
  );
}

export type MarketingFeatureGridSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  tone?: SectionTone;
  className?: string;
};

export function MarketingFeatureGridSection({
  eyebrow,
  title,
  description,
  children,
  tone = "default",
  className,
}: MarketingFeatureGridSectionProps) {
  return (
    <MarketingSection tone={tone} className={className}>
      <MarketingSectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-12">{children}</div>
    </MarketingSection>
  );
}

export type MarketingWorkflowStep = {
  id: string;
  label: string;
};

export function MarketingWorkflowSection({
  eyebrow,
  title,
  description,
  steps,
  tone = "muted",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  steps: MarketingWorkflowStep[];
  tone?: SectionTone;
}) {
  return (
    <MarketingSection tone={tone}>
      <MarketingSectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-12 hidden min-w-0 overflow-x-auto pb-2 lg:block">
        <div className="flex min-w-[960px] items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <article className="rounded-2xl bg-white px-5 py-3 text-center shadow-sm ring-1 ring-[var(--marketing-border-default)] transition-[transform,box-shadow,ring-color] duration-[var(--marketing-duration-fast)] hover:-translate-y-0.5 hover:ring-[var(--marketing-border-accent)]">
                <p className="text-sm font-semibold">{step.label}</p>
              </article>
              {index < steps.length - 1 ? (
                <span className="text-lg text-slate-300" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <ol className="mt-12 space-y-3 lg:hidden">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span className="rounded-xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-slate-200/70">
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </MarketingSection>
  );
}

export function MarketingTimelineSection({
  eyebrow,
  title,
  description,
  steps,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  steps: string[];
}) {
  return (
    <MarketingSection>
      <MarketingSectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="relative mx-auto mt-12 max-w-4xl">
        <div
          aria-hidden
          className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-[var(--marketing-border-accent)] via-[var(--marketing-border-default)] to-[var(--marketing-border-accent)] sm:block"
        />
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="relative flex gap-4 sm:gap-6">
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/70">
                <p className="text-sm font-medium text-slate-900 sm:text-base">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </MarketingSection>
  );
}

export function MarketingComparisonSection({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  tone?: SectionTone;
}) {
  return (
    <MarketingSection tone={tone}>
      <MarketingSectionHeader title={title} description={description} />
      <div className="mt-12">{children}</div>
    </MarketingSection>
  );
}

export function MarketingMetricsSection({
  title,
  description,
  children,
  tone = "muted",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  tone?: SectionTone;
}) {
  return (
    <MarketingSection tone={tone}>
      <MarketingSectionHeader title={title} description={description} />
      <div className="mt-12">{children}</div>
    </MarketingSection>
  );
}

export type MarketingTestimonial = {
  quote: string;
  name: string;
  role: string;
  company?: string;
};

export function MarketingTestimonialsSection({
  title,
  description,
  testimonials,
}: {
  title: string;
  description?: string;
  testimonials: MarketingTestimonial[];
}) {
  return (
    <MarketingSection tone="muted">
      <MarketingSectionHeader title={title} description={description} />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <figure
            key={`${item.name}-${item.role}`}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70"
          >
            <blockquote className="text-sm leading-relaxed text-slate-700">
              “{item.quote}”
            </blockquote>
            <figcaption className="mt-4">
              <p className="text-sm font-semibold text-slate-950">{item.name}</p>
              <p className="text-xs text-slate-500">
                {item.role}
                {item.company ? ` · ${item.company}` : ""}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </MarketingSection>
  );
}

export type MarketingCtaAction = {
  label: string;
  href: string;
  variant?: "primary" | "outline";
};

export function MarketingCtaSection({
  title,
  description,
  actions,
  tone = "dark",
  id,
}: {
  title: string;
  description?: string;
  actions: MarketingCtaAction[];
  tone?: SectionTone;
  id?: string;
}) {
  const onDark = tone === "dark";

  return (
    <MarketingSection id={id} tone={tone} className="relative overflow-hidden">
      {onDark ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,115,213,0.16),transparent_42%)]"
        />
      ) : null}
      <div className="relative marketing-prose mx-auto text-center">
        <MarketingH2 className={onDark ? "text-white" : undefined}>{title}</MarketingH2>
        {description ? (
          <p
            className={cn(
              "mt-4 text-base leading-relaxed sm:text-lg",
              onDark ? "text-slate-300" : "text-slate-600",
            )}
          >
            {description}
          </p>
        ) : null}
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(
                marketingButtonVariants({
                  size: "lg",
                  variant: action.variant === "outline" ? "outline" : "primary",
                  onDark,
                }),
                "w-full sm:w-auto",
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

export function MarketingPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("marketing-site min-h-screen", marketingColorClasses.bgPage, className)}>
      <MarketingLocaleProvider>{children}</MarketingLocaleProvider>
    </div>
  );
}

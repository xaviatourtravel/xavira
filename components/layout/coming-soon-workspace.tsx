import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { AppWorkspaceFrame } from "@/components/layout/app-workspace-frame";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ComingSoonRelatedLink = {
  label: string;
  href: string;
};

export type ComingSoonWorkspaceProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  statusLabel?: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  relatedLinks?: ComingSoonRelatedLink[];
  estimatedAvailability?: string;
  description?: string;
};

const DEFAULT_STATUS_LABEL = "Segera hadir";
const DEFAULT_PRIMARY_LABEL = "Kembali ke Hari Ini";
const DEFAULT_PRIMARY_HREF = "/today";
const DEFAULT_SECONDARY_LABEL = "Hubungi Support";
const DEFAULT_SECONDARY_HREF = "/support";

function isExternalHref(href: string) {
  return href.startsWith("mailto:") || href.startsWith("http");
}

export function ComingSoonWorkspace({
  title,
  subtitle,
  icon: Icon,
  statusLabel = DEFAULT_STATUS_LABEL,
  primaryActionLabel = DEFAULT_PRIMARY_LABEL,
  primaryActionHref = DEFAULT_PRIMARY_HREF,
  secondaryActionLabel = DEFAULT_SECONDARY_LABEL,
  secondaryActionHref = DEFAULT_SECONDARY_HREF,
  relatedLinks = [],
  estimatedAvailability,
  description,
}: ComingSoonWorkspaceProps) {
  return (
    <AppWorkspaceFrame
      header={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>
        </div>
      }
    >
      <div className="flex justify-center py-4 md:py-8">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-10">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/80">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>

            <span className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800 ring-1 ring-amber-200/80">
              {statusLabel}
            </span>

            <p className="mt-4 text-base leading-relaxed text-slate-700">
              {subtitle}
            </p>

            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            ) : null}

            {estimatedAvailability ? (
              <p className="mt-3 text-xs font-medium text-slate-400">
                Perkiraan tersedia: {estimatedAvailability}
              </p>
            ) : null}

            <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Link
                href={primaryActionHref}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-10 w-full sm:w-auto",
                )}
              >
                {primaryActionLabel}
              </Link>

              {isExternalHref(secondaryActionHref) ? (
                <a
                  href={secondaryActionHref}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 w-full sm:w-auto",
                  )}
                >
                  {secondaryActionLabel}
                </a>
              ) : (
                <Link
                  href={secondaryActionHref}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 w-full sm:w-auto",
                  )}
                >
                  {secondaryActionLabel}
                </Link>
              )}
            </div>

            {relatedLinks.length > 0 ? (
              <div className="mt-8 w-full border-t border-slate-100 pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Tautan terkait
                </p>
                <ul className="mt-3 flex flex-wrap justify-center gap-2">
                  {relatedLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                      >
                        {link.label}
                        <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppWorkspaceFrame>
  );
}

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkspaceHubCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  className?: string;
};

export function WorkspaceHubCard({
  title,
  description,
  href,
  icon: Icon,
  className,
}: WorkspaceHubCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
    </Link>
  );
}

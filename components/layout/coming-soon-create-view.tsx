import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppWorkspaceFrame } from "@/components/layout/app-workspace-frame";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ComingSoonCreateViewProps = {
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
};

export function ComingSoonCreateView({
  title,
  description,
  backHref,
  backLabel = "Kembali",
}: ComingSoonCreateViewProps) {
  return (
    <AppWorkspaceFrame
      header={
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
            Segera hadir
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      }
    >
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-800">
          Form pembuatan {title.toLowerCase()} sedang disiapkan.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Fitur ini akan segera tersedia di workspace Desklabs Anda.
        </p>
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    </AppWorkspaceFrame>
  );
}

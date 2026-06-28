"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type OnboardingStepShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function OnboardingStepShell({
  step,
  totalSteps,
  title,
  description,
  children,
  footer,
  className,
}: OnboardingStepShellProps) {
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none",
        className,
      )}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
            Langkah {step} dari {totalSteps}
          </p>
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-8">{children}</div>

      {footer ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">{footer}</div> : null}
    </div>
  );
}

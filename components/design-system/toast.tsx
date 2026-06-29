import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DsToastVariant = "success" | "error" | "info";

type DsToastProps = {
  variant: DsToastVariant;
  title: string;
  description?: string;
  className?: string;
};

const toastConfig: Record<
  DsToastVariant,
  { icon: typeof CheckCircle2; className: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50",
    iconClass: "text-emerald-600",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50",
    iconClass: "text-red-600",
  },
  info: {
    icon: Info,
    className: "border-sky-200 bg-sky-50",
    iconClass: "text-sky-600",
  },
};

export function DsToast({ variant, title, description, className }: DsToastProps) {
  const config = toastConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="status"
      className={cn(
        "flex w-full max-w-sm gap-3 rounded-xl border p-4 shadow-sm",
        config.className,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconClass)} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function DsToastStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

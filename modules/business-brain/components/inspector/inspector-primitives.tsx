import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function InspectorSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function InspectorCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-muted/35 px-3.5 py-3", className)}>{children}</div>
  );
}

type InspectorBadgeProps = {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "muted";
  className?: string;
};

const BADGE_VARIANTS: Record<NonNullable<InspectorBadgeProps["variant"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  muted: "bg-muted text-muted-foreground",
};

export function InspectorBadge({
  children,
  variant = "muted",
  className,
}: InspectorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        BADGE_VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type InspectorListItem = {
  id: string;
  label: string;
  detail?: string;
};

export function InspectorList({
  items,
  emptyMessage = "Nothing here yet.",
}: {
  items: InspectorListItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <InspectorEmptyState message={emptyMessage} />;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg bg-muted/35 px-3 py-2">
          <p className="text-sm text-foreground">{item.label}</p>
          {item.detail ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {item.detail}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function InspectorEmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "py-4 text-center text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {message}
    </p>
  );
}

export function InspectorConversationBubble({
  role,
  children,
}: {
  role: "customer" | "ai";
  children: string;
}) {
  const isAi = role === "ai";

  return (
    <div className={cn("flex", isAi ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isAi
            ? "rounded-tl-md bg-muted/50 text-foreground"
            : "rounded-tr-md bg-primary text-primary-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function InspectorMetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}</span>
        <div className="mt-0.5 text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function InspectorKeyValueRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-0.5 text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

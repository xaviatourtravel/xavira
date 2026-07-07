import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function IntelligencePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col bg-background",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function IntelligencePanelHeader({
  title = "Customer Intelligence",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="shrink-0 border-b border-soft bg-card/90 px-5 py-4 backdrop-blur-sm">
      <p className="text-[13px] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function IntelligencePanelBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-5 py-5",
        className,
      )}
    >
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function IntelligenceSection({
  title,
  badge,
  children,
  className,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function IntelligencePreviewBadge() {
  return (
    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
      Preview
    </span>
  );
}

export function IntelligenceSurface({
  children,
  className,
  inset = false,
}: {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-soft bg-card",
        inset && "bg-muted/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function IntelligenceEmpty({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-soft bg-muted/30 px-4 py-3.5",
        className,
      )}
    >
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function IntelligenceField({
  label,
  value,
  placeholder = "-",
  onChange,
  type = "text",
  readOnly = false,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  const isEmpty = !value.trim();

  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {readOnly || !onChange ? (
        <div
          className={cn(
            "min-h-[34px] rounded-lg bg-muted/40 px-3 py-2 text-xs",
            isEmpty ? "text-muted-foreground/70" : "text-foreground",
          )}
        >
          {isEmpty ? placeholder : value}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border-0 bg-muted/40 px-3 py-2 text-xs text-foreground ring-1 ring-border placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      )}
    </label>
  );
}

export function IntelligenceMetric({
  label,
  value,
  sublabel,
  placeholder = "-",
  accent,
}: {
  label: string;
  value: string | null;
  sublabel?: string | null;
  placeholder?: string;
  accent?: "default" | "score" | "revenue";
}) {
  const isEmpty = !value;

  return (
    <IntelligenceSurface className="p-4">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
          isEmpty && "text-muted-foreground/40",
          accent === "score" && !isEmpty && "text-foreground",
          accent === "revenue" && !isEmpty && "text-emerald-700 dark:text-emerald-400",
        )}
      >
        {value ?? placeholder}
      </p>
      {sublabel ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{sublabel}</p>
      ) : null}
    </IntelligenceSurface>
  );
}

export function IntelligenceDivider() {
  return <div className="h-px bg-border" />;
}

/** @deprecated Use IntelligencePanel */
export const WorkspacePanel = IntelligencePanel;

/** @deprecated Use IntelligencePanelHeader */
export const WorkspacePanelHeader = IntelligencePanelHeader;

/** @deprecated Use IntelligencePanelBody */
export const WorkspacePanelBody = IntelligencePanelBody;

/** @deprecated Use IntelligenceSection */
export const WorkspaceSection = IntelligenceSection;

/** @deprecated Use IntelligenceSurface */
export const WorkspaceCard = IntelligenceSurface;

/** @deprecated Use IntelligenceEmpty */
export const WorkspaceEmptyState = IntelligenceEmpty;

/** @deprecated Use IntelligenceMetric */
export const WorkspaceMetric = IntelligenceMetric;

/** @deprecated Use IntelligenceField */
export const WorkspaceField = IntelligenceField;

/** @deprecated */
export const WorkspaceSelectEmpty = IntelligenceEmpty;

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { getWorkspaceStatusToneClass } from "./styles";
import type { WorkspaceMetadataItem, WorkspaceStatusTone } from "./types";

type WorkspaceHeaderProps = {
  entityType?: string;
  name: string;
  avatar?: ReactNode;
  icon?: LucideIcon;
  imageUrl?: string | null;
  statusBadge?: ReactNode;
  statusLabel?: string;
  statusTone?: WorkspaceStatusTone;
  metadata?: WorkspaceMetadataItem[];
  actions?: ReactNode;
  className?: string;
};

function WorkspaceAvatarFallback({
  name,
  icon: Icon,
}: {
  name: string;
  icon?: LucideIcon;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-base font-semibold text-foreground shadow-sm ring-1 ring-border/60">
      {Icon ? <Icon className="h-6 w-6 text-muted-foreground" /> : initials || "?"}
    </div>
  );
}

export function WorkspaceHeader({
  entityType,
  name,
  avatar,
  icon,
  imageUrl,
  statusBadge,
  statusLabel,
  statusTone = "default",
  metadata = [],
  actions,
  className,
}: WorkspaceHeaderProps) {
  const resolvedStatusBadge =
    statusBadge ??
    (statusLabel ? (
      <span className={getWorkspaceStatusToneClass(statusTone)}>
        {statusLabel}
      </span>
    ) : null);

  return (
    <header className={cn("py-5", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {avatar ?? (
            <>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover shadow-sm ring-1 ring-border/60"
                />
              ) : (
                <WorkspaceAvatarFallback name={name} icon={icon} />
              )}
            </>
          )}

          <div className="min-w-0 space-y-3">
            {entityType ? (
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {entityType}
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {name}
                </h1>
                {resolvedStatusBadge}
              </div>

              {metadata.length > 0 ? (
                <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {metadata.map((item, index) => (
                    <div key={item.id ?? `${item.label}-${index}`} className="min-w-0">
                      <dt className="inline text-muted-foreground after:content-[':']">
                        {item.label}
                      </dt>{" "}
                      <dd className="inline font-medium text-foreground">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function WorkspaceHeaderSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-5", className)}>{children}</div>
  );
}

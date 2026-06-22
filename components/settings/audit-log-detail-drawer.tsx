"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import {
  formatAuditActionLabel,
  formatAuditModuleLabel,
  getAuditModule,
  sanitizeAuditMetadata,
  type AuditLogRow,
} from "@/lib/audit";
import { formatTeamRoleLabel } from "@/lib/team/constants";
import type { UserRole } from "@/types/app-types";
import { cn } from "@/lib/utils";

type AuditLogDetailDrawerProps = {
  log: AuditLogRow | null;
  onClose: () => void;
};

function formatDrawerTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  })
    .format(new Date(value))
    .replace(",", "");
}

function formatMetadataLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AuditLogDetailDrawer({ log, onClose }: AuditLogDetailDrawerProps) {
  useEffect(() => {
    if (!log) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [log, onClose]);

  if (!log) {
    return null;
  }

  const metadata = sanitizeAuditMetadata(log.metadata_json);
  const moduleLabel = formatAuditModuleLabel(getAuditModule(log));

  return (
    <>
      <button
        type="button"
        aria-label="Close audit detail"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-2xl",
          "animate-in slide-in-from-right duration-200",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div>
            <h3 className="text-base font-semibold">Audit Details</h3>
            <p className="text-sm text-muted-foreground">{moduleLabel}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <DetailField label="User" value={log.actor_name} />
          <DetailField
            label="Role"
            value={formatTeamRoleLabel(log.actor_role as UserRole)}
          />
          <DetailField label="Action" value={formatAuditActionLabel(log.action)} />
          <DetailField label="Timestamp" value={formatDrawerTimestamp(log.created_at)} />
          <DetailField label="Module" value={moduleLabel} />
          <DetailField
            label="Entity"
            value={log.entity_label || log.entity_id || "—"}
          />

          {Object.keys(metadata).length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Metadata</p>
              <dl className="space-y-3 rounded-xl border bg-muted/20 p-4">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {formatMetadataLabel(key)}
                    </dt>
                    <dd className="mt-1 break-all text-sm font-medium">
                      {value == null ? "—" : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

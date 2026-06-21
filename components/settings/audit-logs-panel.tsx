"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  formatAuditActionLabel,
  formatAuditEntityTypeLabel,
  type AuditLogRow,
} from "@/lib/audit";
import { cn } from "@/lib/utils";

type AuditLogsPanelProps = {
  logs: AuditLogRow[];
  actors: Array<{ id: string; name: string }>;
  filters: {
    entityType: string;
    actorUserId: string;
    action: string;
    fromDate: string;
    toDate: string;
  };
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function summarizeMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "—";
  }

  return Object.entries(metadata)
    .slice(0, 4)
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`)
    .join(" · ");
}

export function AuditLogsPanel({ logs, actors, filters }: AuditLogsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const pushFilters = useCallback(
    (updates: Partial<AuditLogsPanelProps["filters"]>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", "audit");

      const next = { ...filters, ...updates };

      if (next.entityType) {
        params.set("entity_type", next.entityType);
      } else {
        params.delete("entity_type");
      }

      if (next.actorUserId) {
        params.set("actor", next.actorUserId);
      } else {
        params.delete("actor");
      }

      if (next.action) {
        params.set("action", next.action);
      } else {
        params.delete("action");
      }

      if (next.fromDate) {
        params.set("from", next.fromDate);
      } else {
        params.delete("from");
      }

      if (next.toDate) {
        params.set("to", next.toDate);
      } else {
        params.delete("to");
      }

      startTransition(() => {
        router.replace(`/settings?${params.toString()}`);
      });
    },
    [filters, router, searchParams],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-base font-semibold">Audit Logs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Track important team activity across inbox, leads, bookings, payments,
            and settings.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select
            value={filters.entityType}
            onChange={(event) =>
              pushFilters({ entityType: event.target.value })
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All modules</option>
            {AUDIT_ENTITY_TYPES.map((entityType) => (
              <option key={entityType} value={entityType}>
                {formatAuditEntityTypeLabel(entityType)}
              </option>
            ))}
          </select>

          <select
            value={filters.actorUserId}
            onChange={(event) =>
              pushFilters({ actorUserId: event.target.value })
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All actors</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(event) => pushFilters({ action: event.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {formatAuditActionLabel(action)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => pushFilters({ fromDate: event.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => pushFilters({ toDate: event.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </section>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No audit activity yet. Team actions will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatTimestamp(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{log.actor_name}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {log.actor_role.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatAuditActionLabel(log.action)}
                  </td>
                  <td className="px-4 py-3">
                    {log.entity_label || log.entity_id || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {formatAuditEntityTypeLabel(log.entity_type)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-muted-foreground",
                      "max-w-[320px] truncate",
                    )}
                    title={summarizeMetadata(log.metadata_json)}
                  >
                    {summarizeMetadata(log.metadata_json)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

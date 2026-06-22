"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { AuditActivitySummaryCard } from "@/components/settings/audit-activity-summary";
import { AuditLogDetailDrawer } from "@/components/settings/audit-log-detail-drawer";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  formatAuditActionLabel,
  formatAuditModuleLabel,
  getAuditModule,
  summarizeAuditMetadata,
  type AuditActivitySummary,
  type AuditLogRow,
} from "@/lib/audit";
import { formatTeamRoleLabel } from "@/lib/team/constants";
import type { UserRole } from "@/types/app-types";
import { cn } from "@/lib/utils";

type AuditLogsPanelProps = {
  logs: AuditLogRow[];
  actors: Array<{ id: string; name: string; role: string }>;
  roles: string[];
  activitySummary: AuditActivitySummary;
  filters: {
    module: string;
    actorUserId: string;
    actorRole: string;
    action: string;
    fromDate: string;
    toDate: string;
  };
};

function formatTableTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function AuditLogsPanel({
  logs,
  actors,
  roles,
  activitySummary,
  filters,
}: AuditLogsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const pushFilters = useCallback(
    (updates: Partial<AuditLogsPanelProps["filters"]>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", "audit");

      const next = { ...filters, ...updates };

      if (next.module) {
        params.set("module", next.module);
      } else {
        params.delete("module");
      }

      if (next.actorUserId) {
        params.set("actor", next.actorUserId);
      } else {
        params.delete("actor");
      }

      if (next.actorRole) {
        params.set("role", next.actorRole);
      } else {
        params.delete("role");
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

      params.delete("entity_type");

      startTransition(() => {
        router.replace(`/settings?${params.toString()}`);
      });
    },
    [filters, router, searchParams],
  );

  return (
    <div className="space-y-6">
      <AuditActivitySummaryCard summary={activitySummary} />

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold">Audit Logs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete visibility into team activity across Desklabs.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <select
            value={filters.actorUserId}
            onChange={(event) =>
              pushFilters({ actorUserId: event.target.value })
            }
            className="min-h-[44px] rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All users</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>

          <select
            value={filters.actorRole}
            onChange={(event) => pushFilters({ actorRole: event.target.value })}
            className="min-h-[44px] rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {formatTeamRoleLabel(role as UserRole)}
              </option>
            ))}
          </select>

          <select
            value={filters.module}
            onChange={(event) => pushFilters({ module: event.target.value })}
            className="min-h-[44px] rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All modules</option>
            {AUDIT_MODULES.map((module) => (
              <option key={module} value={module}>
                {formatAuditModuleLabel(module)}
              </option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(event) => pushFilters({ action: event.target.value })}
            className="min-h-[44px] rounded-lg border px-3 py-2 text-sm"
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
            className="min-h-[44px] rounded-lg border px-3 py-2 text-sm"
            aria-label="From date"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => pushFilters({ toDate: event.target.value })}
            className="min-h-[44px] rounded-lg border px-3 py-2 text-sm"
            aria-label="To date"
          />
        </div>
      </section>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No audit activity yet.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {logs.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setSelectedLog(log)}
                className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatAuditActionLabel(log.action)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTableTimestamp(log.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium">
                    {formatAuditModuleLabel(getAuditModule(log))}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">User</p>
                    <p className="font-medium">{log.actor_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entity</p>
                    <p className="font-medium">
                      {log.entity_label || log.entity_id || "—"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-sm md:block">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Module</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/30"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatTableTimestamp(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.actor_name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {formatTeamRoleLabel(log.actor_role as UserRole)}
                    </td>
                    <td className="px-4 py-3">
                      {formatAuditActionLabel(log.action)}
                    </td>
                    <td className="px-4 py-3">
                      {formatAuditModuleLabel(getAuditModule(log))}
                    </td>
                    <td className="px-4 py-3">
                      {log.entity_label || log.entity_id || "—"}
                    </td>
                    <td
                      className={cn(
                        "max-w-[280px] truncate px-4 py-3 text-muted-foreground",
                      )}
                      title={summarizeAuditMetadata(log.metadata_json)}
                    >
                      {summarizeAuditMetadata(log.metadata_json)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AuditLogDetailDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}

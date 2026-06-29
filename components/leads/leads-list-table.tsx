"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { bulkDeleteLeads } from "@/app/(dashboard)/leads/actions";
import { EditLeadModal } from "@/components/leads/edit-lead-modal";
import { LeadTemperatureInlineSelect } from "@/components/leads/lead-temperature-inline-select";
import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import { buttonVariants } from "@/components/ui/button";
import type { LeadFormOptions } from "@/lib/leads/lead-form-types";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import type { Profile } from "@/types/app-types";
import { cn } from "@/lib/utils";

export type LeadsListTableRow = {
  id: string;
  fullName: string;
  contactPhone: string;
  sourceLabel: string;
  interestLabel: string;
  packageInterest: string;
  statusLabel: string;
  assignedUserLabel: string;
  leadDateLabel: string;
  crmCreatedAtLabel: string;
  whatsAppHref: string | null;
  canEdit: boolean;
  leadTemperature: string | null;
  status: string;
  updatedAt: string;
};

type LeadsListTableProps = {
  rows: LeadsListTableRow[];
  profile: Profile;
  formOptions: LeadFormOptions;
  canBulkDelete: boolean;
  returnTo: string;
  currentPage: number;
  totalPages: number;
  previousPageHref: string | null;
  nextPageHref: string | null;
};

const BULK_DELETE_CONFIRM_MESSAGE =
  "Yakin ingin menghapus lead terpilih? Data follow up, aktivitas, booking terkait, peserta, dan pembayaran bisa ikut terhapus jika terhubung.";

export function LeadsListTable({
  rows,
  profile,
  formOptions,
  canBulkDelete,
  returnTo,
  currentPage,
  totalPages,
  previousPageHref,
  nextPageHref,
}: LeadsListTableProps) {
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  const allVisibleSelected =
    rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected =
    rowIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected;

  function toggleLead(leadId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(leadId) ? current : [...current, leadId];
      }

      return current.filter((id) => id !== leadId);
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds(checked ? [...rowIds] : []);
  }

  function handleBulkDeleteSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (selectedIds.length === 0) {
      event.preventDefault();
      return;
    }

    if (!confirm(BULK_DELETE_CONFIRM_MESSAGE)) {
      event.preventDefault();
    }
  }

  return (
    <>
      {canBulkDelete && selectedIds.length > 0 && (
        <form
          action={bulkDeleteLeads}
          onSubmit={handleBulkDeleteSubmit}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <input type="hidden" name="return_to" value={returnTo} />
          {selectedIds.map((leadId) => (
            <input key={leadId} type="hidden" name="lead_ids" value={leadId} />
          ))}

          <p className="text-sm font-medium text-red-900">
            {selectedIds.length} lead dipilih
          </p>

          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-red-600 text-red-600 hover:bg-red-100",
            )}
          >
            Hapus Lead Terpilih
          </button>
        </form>
      )}

      <div className="space-y-3 md:hidden">
        {rows.map((lead) => (
          <article
            key={lead.id}
            className="rounded-2xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <DesklabsAvatar name={lead.fullName} size="md" />
                <div className="min-w-0">
                  <Link
                    href={customerWorkspaceHref(lead.id)}
                    className="block truncate text-base font-semibold text-primary hover:underline"
                  >
                    {lead.fullName}
                  </Link>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {lead.statusLabel}
                  </p>
                </div>
              </div>

              <details className="relative">
                <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border hover:bg-muted [&::-webkit-details-marker]:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-10 mt-2 min-w-[160px] rounded-xl border bg-background p-1 shadow-lg">
                  <Link
                    href={customerWorkspaceHref(lead.id)}
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm hover:bg-muted"
                  >
                    View detail
                  </Link>
                  {lead.whatsAppHref ? (
                    <a
                      href={lead.whatsAppHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-[44px] items-center rounded-lg px-3 text-sm hover:bg-muted"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {lead.canEdit ? (
                    <button
                      type="button"
                      onClick={() => setEditingLeadId(lead.id)}
                      className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm hover:bg-muted"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
              </details>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Source</dt>
                <dd className="font-medium">{lead.sourceLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Assigned</dt>
                <dd className="font-medium">{lead.assignedUserLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Package</dt>
                <dd className="font-medium">{lead.packageInterest}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Lead date</dt>
                <dd className="font-medium">{lead.leadDateLabel}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t pt-3">
              <LeadTemperatureInlineSelect
                leadId={lead.id}
                leadTemperature={lead.leadTemperature}
                status={lead.status}
                updatedAt={lead.updatedAt}
                canEdit={lead.canEdit}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full min-w-[1240px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              {canBulkDelete && (
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua lead di halaman ini"
                    checked={allVisibleSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someVisibleSelected;
                      }
                    }}
                    onChange={(event) => toggleAllVisible(event.target.checked)}
                  />
                </th>
              )}
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">WhatsApp / Telepon</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Minat</th>
              <th className="px-4 py-3 font-medium">Paket</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Temperature</th>
              <th className="px-4 py-3 font-medium">Assigned User</th>
              <th className="px-4 py-3 font-medium">Tanggal Lead</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-b last:border-b-0">
                {canBulkDelete && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Pilih ${lead.fullName}`}
                      checked={selectedIds.includes(lead.id)}
                      onChange={(event) =>
                        toggleLead(lead.id, event.target.checked)
                      }
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={customerWorkspaceHref(lead.id)}
                    className="inline-flex items-center gap-3 text-blue-600 hover:underline"
                  >
                    <DesklabsAvatar name={lead.fullName} size="sm" />
                    {lead.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3">{lead.contactPhone}</td>
                <td className="px-4 py-3">{lead.sourceLabel}</td>
                <td className="px-4 py-3 capitalize">{lead.interestLabel}</td>
                <td className="px-4 py-3">{lead.packageInterest}</td>
                <td className="px-4 py-3 capitalize">{lead.statusLabel}</td>
                <td className="px-4 py-3">
                  <LeadTemperatureInlineSelect
                    leadId={lead.id}
                    leadTemperature={lead.leadTemperature}
                    status={lead.status}
                    updatedAt={lead.updatedAt}
                    canEdit={lead.canEdit}
                  />
                </td>
                <td className="px-4 py-3">{lead.assignedUserLabel}</td>
                <td
                  className="px-4 py-3 whitespace-nowrap text-muted-foreground"
                  title={`Dibuat di CRM: ${lead.crmCreatedAtLabel}`}
                >
                  {lead.leadDateLabel}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {lead.whatsAppHref && (
                      <a
                        href={lead.whatsAppHref}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                      >
                        WhatsApp
                      </a>
                    )}
                    {lead.canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingLeadId(lead.id)}
                        className="rounded border px-3 py-1 text-xs hover:bg-muted"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditLeadModal
        leadId={editingLeadId}
        profile={profile}
        options={formOptions}
        returnTo={returnTo}
        onClose={() => setEditingLeadId(null)}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Halaman {currentPage} dari {totalPages}
        </p>

        <div className="flex gap-2">
          {previousPageHref && (
            <Link
              href={previousPageHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Previous
            </Link>
          )}

          {nextPageHref && (
            <Link
              href={nextPageHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

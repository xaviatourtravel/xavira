"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { bulkDeleteLeads } from "@/app/(dashboard)/leads/actions";
import { buttonVariants } from "@/components/ui/button";
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
  createdAtLabel: string;
  whatsAppHref: string | null;
};

type LeadsListTableProps = {
  rows: LeadsListTableRow[];
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
  canBulkDelete,
  returnTo,
  currentPage,
  totalPages,
  previousPageHref,
  nextPageHref,
}: LeadsListTableProps) {
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1100px] text-sm">
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
              <th className="px-4 py-3 font-medium">Assigned User</th>
              <th className="px-4 py-3 font-medium">Dibuat</th>
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
                    href={`/leads/${lead.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {lead.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3">{lead.contactPhone}</td>
                <td className="px-4 py-3">{lead.sourceLabel}</td>
                <td className="px-4 py-3 capitalize">{lead.interestLabel}</td>
                <td className="px-4 py-3">{lead.packageInterest}</td>
                <td className="px-4 py-3 capitalize">{lead.statusLabel}</td>
                <td className="px-4 py-3">{lead.assignedUserLabel}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {lead.createdAtLabel}
                </td>
                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

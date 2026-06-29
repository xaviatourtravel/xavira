import Link from "next/link";

import { createBulkCriticalFollowUps } from "@/app/(dashboard)/leads/critical/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  buildCriticalLeadListItems,
  type CriticalLeadSourceRecord,
} from "@/lib/leads/critical-leads";
import { requireProfile } from "@/lib/auth/session";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type CriticalLeadsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function CriticalLeadsPage({
  searchParams,
}: CriticalLeadsPageProps) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [{ data: leads, error: leadsError }, { data: followUpTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          `
          id,
          full_name,
          status,
          assigned_to,
          updated_at,
          whatsapp_number,
          phone,
          profiles!leads_assigned_to_fkey (
            full_name
          )
        `,
        )
        .eq("organization_id", profile.organization_id)
        .is("deleted_at", null)
        .not("status", "in", "(won,lost)"),
      supabase
        .from("follow_up_tasks")
        .select("lead_id")
        .eq("organization_id", profile.organization_id),
    ]);

  if (leadsError || tasksError) {
    throw new Error("Gagal memuat critical leads.");
  }

  const criticalLeads = buildCriticalLeadListItems(
    (leads ?? []) as CriticalLeadSourceRecord[],
    followUpTasks ?? [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Critical Leads Center</h1>
          <p className="text-sm text-muted-foreground">
            Lead aktif dengan skor kesehatan Critical yang perlu perhatian segera.
          </p>
        </div>

        <Link
          href="/leads"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Kembali ke Leads
        </Link>
      </div>

      {params.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(params.success)}
        </div>
      )}

      {params.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {criticalLeads.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Tidak ada critical lead</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Semua lead aktif saat ini berada di atas tingkat Critical.
          </p>
        </div>
      ) : (
        <>
          <form action={createBulkCriticalFollowUps}>
            <button
              type="submit"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Create Follow Up for All Critical Leads
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Lead</th>
                  <th className="px-4 py-3 font-medium">Health Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned User</th>
                  <th className="px-4 py-3 font-medium">Last Updated</th>
                  <th className="px-4 py-3 font-medium">Top Negative Factors</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {criticalLeads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={customerWorkspaceHref(lead.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {lead.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {formatLabel(lead.status)}
                    </td>
                    <td className="px-4 py-3">{lead.assignedUserName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(lead.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {lead.negativeFactors.map((factor) => (
                          <li
                            key={factor}
                            className="text-xs text-red-600 before:mr-1 before:content-['-']"
                          >
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={customerWorkspaceHref(lead.id)}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                        >
                          View Lead
                        </Link>

                        {lead.whatsAppHref ? (
                          <a
                            href={lead.whatsAppHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded bg-green-600 px-2 py-1 text-xs text-white"
                          >
                            Open WhatsApp
                          </a>
                        ) : null}

                        <Link
                          href={customerWorkspaceHref(lead.id)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                        >
                          Create Follow Up
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

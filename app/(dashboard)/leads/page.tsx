import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type LeadRow = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  source: string;
  interest_type: string;
  package_interest: string | null;
  status: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getContactPhone(lead: LeadRow) {
  return lead.whatsapp_number || lead.phone || "-";
}

export default async function LeadsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, whatsapp_number, source, interest_type, package_interest, status, created_at",
    )
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat data lead.");
  }

  const rows = (leads ?? []) as LeadRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Kelola prospect Umroh dan Halal Tour.
          </p>
        </div>
        <Link href="/leads/new" className={cn(buttonVariants())}>
          Tambah Lead
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Belum ada lead</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mulai dengan menambahkan lead pertama Anda.
          </p>
          <Link
            href="/leads/new"
            className={cn(buttonVariants(), "mt-4 inline-flex")}
          >
            Tambah Lead
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">WhatsApp / Telepon</th>
                <th className="px-4 py-3 font-medium">Sumber</th>
                <th className="px-4 py-3 font-medium">Minat</th>
                <th className="px-4 py-3 font-medium">Paket</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr key={lead.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
  <Link
    href={`/leads/${lead.id}`}
    className="text-blue-600 hover:underline"
  >
    {lead.full_name}
  </Link>
</td>
                  <td className="px-4 py-3">{getContactPhone(lead)}</td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(lead.source)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(lead.interest_type)}
                  </td>
                  <td className="px-4 py-3">
                    {lead.package_interest || "-"}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(lead.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(lead.created_at)}
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

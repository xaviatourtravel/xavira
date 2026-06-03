import Link from "next/link";

import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";
import { updateLeadStatus } from "./actions";

function getNextStatus(status: string) {
    const flow: Record<string, string> = {
      new: "contacted",
      contacted: "qualified",
      qualified: "proposal_sent",
      proposal_sent: "negotiating",
      negotiating: "won",
    };
  
    return flow[status] ?? null;
  }

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

type Lead = {
  id: string;
  full_name: string;
  status: string;
  package_interest: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  created_at: string;
};

export default async function LeadPipelinePage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, full_name, status, package_interest, whatsapp_number, phone, created_at")
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat pipeline.");
  }

  const rows = (leads ?? []) as Lead[];
  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pipeline Leads</h1>
        <p className="text-sm text-muted-foreground">
          Pantau posisi lead dari awal masuk sampai closing.
        </p>
      </div>

      <div className="grid gap-4 overflow-x-auto lg:grid-cols-7">
        {STATUSES.map((status) => {
          const statusLeads = rows.filter((lead) => lead.status === status.value);

          return (
            <div key={status.value} className="min-h-[400px] rounded-xl border bg-muted/20 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{status.label}</h2>
                <span className="rounded-full bg-background px-2 py-1 text-xs">
                  {statusLeads.length}
                </span>
              </div>

              <div className="space-y-3">
                {statusLeads.map((lead) => (
                  <div
                  key={lead.id}
                  className="rounded-lg border bg-background p-3 text-sm"
                >
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium hover:underline"
                  >
                    {lead.full_name}
                  </Link>
                
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lead.package_interest || "Belum ada paket"}
                  </p>
                
                  <p className="mt-2 text-xs text-muted-foreground">
                    {lead.whatsapp_number || lead.phone || "-"}
                  </p>
                
                  {getNextStatus(lead.status) && (
                    <form action={updateLeadStatus} className="mt-3">
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <input
                        type="hidden"
                        name="next_status"
                        value={getNextStatus(lead.status) ?? ""}
                      />
                
                      <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 px-2 py-1 text-xs text-white"
                      >
                        Next Status
                      </button>
                    </form>
                  )}
                </div> 
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
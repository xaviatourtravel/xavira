import Link from "next/link";
import { notFound } from "next/navigation";

import { updateLead } from "../actions";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type LeadEdit = {
  id: string;
  full_name: string;
  whatsapp_number: string | null;
  email: string | null;
  source: string;
  interest_type: string;
  package_interest: string | null;
  status: string;
  priority: string;
  budget_idr: number | null;
  travel_date_preference: string | null;
  party_size: number | null;
  notes: string | null;
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export default async function EditLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, whatsapp_number, email, source, interest_type, package_interest, status, priority, budget_idr, travel_date_preference, party_size, notes",
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat data lead.");
  }

  if (!lead) {
    notFound();
  }

  const detail = lead as LeadEdit;
  const { data: packages } = await supabase
  .from("packages")
  .select("id, name")
  .eq("organization_id", profile.organization_id)
  .eq("status", "active")
  .order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Lead</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui data {detail.full_name}.
        </p>
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={updateLead} className="space-y-5 rounded-lg border p-6">
        <input type="hidden" name="lead_id" value={detail.id} />

        <div>
          <label className="text-sm font-medium">Nama Lengkap *</label>
          <input
            name="full_name"
            required
            defaultValue={detail.full_name}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="text-sm font-medium">No WhatsApp</label>
          <input
            name="whatsapp_number"
            defaultValue={detail.whatsapp_number ?? ""}
            className={inputClassName}
            placeholder="Contoh: 6281212345678"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={detail.email ?? ""}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Sumber Lead</label>
          <select
            name="source"
            defaultValue={detail.source}
            className={inputClassName}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Minat</label>
          <select
            name="interest_type"
            defaultValue={detail.interest_type}
            className={inputClassName}
          >
            <option value="umroh">Umroh</option>
            <option value="halal_tour">Halal Tour</option>
            <option value="both">Keduanya</option>
            <option value="unknown">Belum tahu</option>
          </select>
        </div>

        <div>
  <label className="text-sm font-medium">
    Paket Diminati
  </label>

  <select
    name="package_interest"
    defaultValue={detail.package_interest ?? ""}
    className={inputClassName}
  >
    <option value="">
      Pilih Paket
    </option>

    {(packages ?? []).map((pkg) => (
      <option
        key={pkg.id}
        value={pkg.name}
      >
        {pkg.name}
      </option>
    ))}
  </select>
</div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue={detail.status}
            className={inputClassName}
          >
            <option value="new">Baru</option>
            <option value="contacted">Dihubungi</option>
            <option value="qualified">Qualified</option>
            <option value="proposal_sent">Proposal Dikirim</option>
            <option value="negotiating">Negosiasi</option>
            <option value="won">Menang</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Prioritas</label>
          <select
            name="priority"
            defaultValue={detail.priority}
            className={inputClassName}
          >
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Budget (IDR)</label>
          <input
            name="budget_idr"
            type="number"
            min={0}
            defaultValue={detail.budget_idr ?? ""}
            className={inputClassName}
            placeholder="Contoh: 25000000"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tanggal Keberangkatan</label>
          <input
            name="travel_date_preference"
            type="date"
            defaultValue={toDateInputValue(detail.travel_date_preference)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Jumlah Peserta</label>
          <input
            name="party_size"
            type="number"
            min={1}
            defaultValue={detail.party_size ?? ""}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Catatan</label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={detail.notes ?? ""}
            className={inputClassName}
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Perubahan
          </button>
          <Link
            href={`/leads/${detail.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

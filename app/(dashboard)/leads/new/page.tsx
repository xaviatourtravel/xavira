import Link from "next/link";

import { createLead } from "../actions";
import { LeadSourceSelect } from "@/components/leads/lead-source-select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
const supabase = await createClient();

const { data: packages } = await supabase
  .from("packages")
  .select("id, name")
  .eq("organization_id", profile.organization_id)
  .eq("status", "active")
  .order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tambah Lead</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan data calon jamaah atau calon peserta tour.
        </p>
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createLead} className="space-y-5 rounded-lg border p-6">
        <div>
          <label className="text-sm font-medium">Nama Lengkap *</label>
          <input
            name="full_name"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Contoh: Ahmad Fauzi"
          />
        </div>

        <div>
          <label className="text-sm font-medium">No WhatsApp</label>
          <input
            name="whatsapp_number"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Contoh: 6281212345678"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="nama@email.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Lead Source</label>
          <LeadSourceSelect className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium">Minat</label>
          <select
            name="interest_type"
            defaultValue="halal_tour"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
          <label className="text-sm font-medium">Catatan</label>
          <textarea
            name="notes"
            rows={4}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Contoh: Tanya harga untuk 4 pax, rencana berangkat Oktober."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Lead
          </button>
          <Link
            href="/leads"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
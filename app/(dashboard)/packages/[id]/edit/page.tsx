import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updatePackage } from "../../actions";
import { buttonVariants } from "@/components/ui/button";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export default async function EditPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/packages?error=Hanya admin atau owner yang dapat mengubah paket.",
    );
  }

  const supabase = await createClient();

  const { data: pkg, error } = await supabase
    .from("packages")
    .select(
      "id, name, destination, departure_date, duration_days, price_idr, quota, status",
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat paket.");
  }

  if (!pkg) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Paket</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui informasi paket travel.
        </p>
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={updatePackage} className="space-y-5 rounded-lg border p-6">
        <input type="hidden" name="package_id" value={pkg.id} />

        <div>
          <label className="text-sm font-medium">Nama Paket *</label>
          <input
            name="name"
            required
            defaultValue={pkg.name}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Destinasi</label>
          <input
            name="destination"
            defaultValue={pkg.destination ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tanggal Berangkat</label>
          <input
            name="departure_date"
            type="date"
            defaultValue={pkg.departure_date ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Durasi Hari</label>
          <input
            name="duration_days"
            type="number"
            min="1"
            defaultValue={pkg.duration_days ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Harga IDR</label>
          <input
            name="price_idr"
            type="number"
            min="0"
            defaultValue={pkg.price_idr ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Kuota</label>
          <input
            name="quota"
            type="number"
            min="0"
            defaultValue={pkg.quota ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue={pkg.status}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold_out">Sold Out</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Perubahan
          </button>

          <Link
            href="/packages"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
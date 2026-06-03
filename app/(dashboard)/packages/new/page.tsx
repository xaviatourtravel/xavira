import Link from "next/link";

import { createPackage } from "../actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tambah Paket</h1>
        <p className="text-sm text-muted-foreground">
          Tambahkan paket Umroh atau Halal Tour yang akan dijual tim sales.
        </p>
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createPackage} className="space-y-5 rounded-lg border p-6">
        <div>
          <label className="text-sm font-medium">Nama Paket *</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Contoh: Yunnan Muslim Tour 8D6N"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Destinasi</label>
          <input
            name="destination"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Contoh: Kunming, Dali, Lijiang"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tanggal Berangkat</label>
          <input
            name="departure_date"
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Durasi Hari</label>
          <input
            name="duration_days"
            type="number"
            min="1"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="8"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Harga IDR</label>
          <input
            name="price_idr"
            type="number"
            min="0"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="18900000"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Kuota</label>
          <input
            name="quota"
            type="number"
            min="0"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="24"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue="draft"
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
            Simpan Paket
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
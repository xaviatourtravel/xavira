import Link from "next/link";

import { PackageRowActions } from "@/components/packages/package-row-actions";
import { buttonVariants } from "@/components/ui/button";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type PackageRow = {
  id: string;
  organization_id: string;
  name: string;
  destination: string | null;
  departure_date: string | null;
  duration_days: number | null;
  price_idr: number | null;
  quota: number | null;
  status: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canManagePackages = isAdminOrOwner(profile);
  const supabase = await createClient();

  const { data: packages, error } = await supabase
    .from("packages")
    .select(
      "id, organization_id, name, destination, departure_date, duration_days, price_idr, quota, status, created_at",
    )
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat data paket.");
  }

  const rows = (packages ?? []) as PackageRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Paket</h1>
          <p className="text-sm text-muted-foreground">
            {canManagePackages
              ? "Kelola paket Umroh dan Halal Tour untuk tim sales Anda."
              : "Lihat paket Umroh dan Halal Tour yang tersedia untuk tim sales."}
          </p>
        </div>

        {canManagePackages && (
          <Link href="/packages/new" className={cn(buttonVariants())}>
            Tambah Paket
          </Link>
        )}
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Belum ada paket</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {canManagePackages
              ? "Mulai dengan menambahkan paket pertama Anda."
              : "Belum ada paket yang tersedia di organisasi Anda."}
          </p>
          {canManagePackages && (
            <Link
              href="/packages/new"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              Tambah Paket
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Destinasi</th>
                <th className="px-4 py-3 font-medium">Tanggal Berangkat</th>
                <th className="px-4 py-3 font-medium">Durasi</th>
                <th className="px-4 py-3 font-medium">Harga</th>
                <th className="px-4 py-3 font-medium">Kuota</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManagePackages && (
                  <th className="px-4 py-3 font-medium">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((pkg) => (
                <tr key={pkg.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{pkg.name}</td>
                  <td className="px-4 py-3">{pkg.destination || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {pkg.departure_date ? formatDate(pkg.departure_date) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {pkg.duration_days ? `${pkg.duration_days} hari` : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {pkg.price_idr != null ? formatCurrency(pkg.price_idr) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {pkg.quota != null ? pkg.quota : "-"}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(pkg.status)}
                  </td>
                  {canManagePackages && (
                    <td className="px-4 py-3">
                      <PackageRowActions
                        packageId={pkg.id}
                        canEdit={canManagePackages}
                        canDelete={canManagePackages}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

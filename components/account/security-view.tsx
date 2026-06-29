import Link from "next/link";

import { AccountCard } from "@/components/account/account-card";
import { Button } from "@/components/ui/button";
import { designSystemMutedPanelClass } from "@/lib/design-system/tokens";

type SecurityViewProps = {
  email: string;
};

export function SecurityView({ email }: SecurityViewProps) {
  return (
    <div className="space-y-6">
      <AccountCard
        title="Password"
        description="Perbarui password akun Anda secara berkala untuk menjaga keamanan."
      >
        <Link href="/forgot-password">
          <Button type="button" variant="outline" className="h-11">
            Ubah Password
          </Button>
        </Link>
      </AccountCard>

      <AccountCard
        title="Sesi Login"
        description="Perangkat yang sedang menggunakan akun Anda."
      >
        <div className={designSystemMutedPanelClass + " p-4"}>
          <p className="text-sm font-medium text-slate-900">Sesi aktif saat ini</p>
          <p className="mt-1 text-sm text-slate-600">{email}</p>
          <p className="mt-2 text-xs text-slate-500">
            Perangkat ini · Terakhir diperbarui saat Anda masuk
          </p>
        </div>
      </AccountCard>

      <AccountCard
        title="Two-Factor Authentication"
        description="Lapisan keamanan tambahan untuk akun Anda."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Status: Belum aktif</p>
            <p className="mt-1 text-sm text-slate-500">
              Aktifkan 2FA untuk melindungi akun dari akses tidak sah.
            </p>
          </div>
          <Button type="button" disabled className="h-11 shrink-0 gap-2">
            Aktifkan 2FA
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Segera
            </span>
          </Button>
        </div>
      </AccountCard>
    </div>
  );
}

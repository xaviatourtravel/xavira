import { AccountCard } from "@/components/account/account-card";
import { designSystemMutedPanelClass } from "@/lib/design-system/tokens";

type BillingViewProps = {
  teamMemberCount: number;
  workspaceName: string;
};

export function BillingView({ teamMemberCount, workspaceName }: BillingViewProps) {
  return (
    <div className="space-y-6">
      <AccountCard title="Paket Saat Ini">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Plan
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-950">Internal / Alpha</dd>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200/70">
            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Status
            </dt>
            <dd className="mt-1 text-sm font-semibold text-emerald-900">Aktif</dd>
          </div>
        </dl>
      </AccountCard>

      <AccountCard title="Penggunaan">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <dt className="text-xs text-slate-500">Workspace</dt>
            <dd className="mt-1 truncate text-sm font-medium text-slate-900">
              {workspaceName}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <dt className="text-xs text-slate-500">Anggota Tim</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{teamMemberCount}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <dt className="text-xs text-slate-500">Storage</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">Termasuk dalam paket</dd>
          </div>
        </dl>
      </AccountCard>

      <AccountCard title="Invoice">
        <div className={designSystemMutedPanelClass + " p-6 text-center"}>
          <p className="text-sm text-slate-600">Belum ada invoice.</p>
        </div>
      </AccountCard>

      <AccountCard title="Metode Pembayaran">
        <div className={designSystemMutedPanelClass + " p-6 text-center"}>
          <p className="text-sm text-slate-600">Metode pembayaran belum tersedia.</p>
        </div>
      </AccountCard>
    </div>
  );
}

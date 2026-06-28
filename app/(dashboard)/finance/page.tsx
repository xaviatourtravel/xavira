import { BarChart3, FileText, Receipt, TrendingUp, Wallet } from "lucide-react";

import { WorkspaceHubView } from "@/components/layout/workspace-hub-view";
import { requireProfile } from "@/lib/auth/session";

export default async function FinancePage() {
  await requireProfile();

  return (
    <WorkspaceHubView
      title="Keuangan"
      subtitle="Pantau pembayaran, invoice, outstanding, dan arus kas customer dengan lebih rapi."
      items={[
        {
          id: "pembayaran",
          title: "Pembayaran",
          description: "Konfirmasi pembayaran dan status transaksi customer.",
          href: "/revenue",
          icon: Wallet,
        },
        {
          id: "invoice",
          title: "Invoice",
          description: "Invoice outstanding dan riwayat tagihan.",
          href: "/finance/invoices",
          icon: FileText,
        },
        {
          id: "ringkasan-keuangan",
          title: "Ringkasan Keuangan",
          description: "Ringkasan pendapatan dan performa keuangan.",
          href: "/finance/summary",
          icon: BarChart3,
        },
        {
          id: "outstanding",
          title: "Outstanding",
          description: "Tagihan belum lunas dan piutang customer.",
          href: "/finance/outstanding",
          icon: Receipt,
        },
        {
          id: "laporan-keuangan",
          title: "Laporan Keuangan",
          description: "Laporan arus kas dan performa keuangan workspace.",
          href: "/finance/reports",
          icon: TrendingUp,
        },
      ]}
    />
  );
}

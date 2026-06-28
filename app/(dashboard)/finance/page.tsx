import { BarChart3, FileText, Wallet } from "lucide-react";

import { WorkspaceHubView } from "@/components/layout/workspace-hub-view";
import { requireProfile } from "@/lib/auth/session";

export default async function FinancePage() {
  await requireProfile();

  return (
    <WorkspaceHubView
      title="Keuangan"
      subtitle="Pantau pembayaran, invoice, dan outstanding customer."
      items={[
        {
          title: "Payments",
          description: "Konfirmasi pembayaran dan status transaksi customer.",
          href: "/revenue",
          icon: Wallet,
        },
        {
          title: "Invoices",
          description: "Invoice outstanding dan riwayat tagihan.",
          href: "/revenue?view=invoices",
          icon: FileText,
        },
        {
          title: "Revenue Summary",
          description: "Ringkasan pendapatan dan performa keuangan.",
          href: "/revenue",
          icon: BarChart3,
        },
      ]}
    />
  );
}

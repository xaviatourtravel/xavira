import { TrendingUp } from "lucide-react";

import { ComingSoonWorkspace } from "@/components/layout/coming-soon-workspace";
import { resolveComingSoonPreset } from "@/lib/navigation/coming-soon-presets";
import { requireProfile } from "@/lib/auth/session";

export default async function FinanceReportsPage() {
  await requireProfile();

  return (
    <ComingSoonWorkspace
      {...resolveComingSoonPreset({
        title: "Laporan Keuangan",
        subtitle: "Laporan arus kas, pendapatan, dan performa keuangan workspace.",
        icon: TrendingUp,
        relatedLinks: [
          { label: "Keuangan", href: "/finance" },
          { label: "Pembayaran", href: "/revenue" },
        ],
      })}
    />
  );
}

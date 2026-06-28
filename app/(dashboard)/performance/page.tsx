import { BarChart3, LayoutDashboard, Megaphone, PenLine } from "lucide-react";

import { WorkspaceHubView } from "@/components/layout/workspace-hub-view";
import { requireProfile } from "@/lib/auth/session";

export default async function PerformancePage() {
  await requireProfile();

  return (
    <WorkspaceHubView
      title="Performa"
      subtitle="Lihat performa bisnis, campaign, konten, dan insight operasional dalam satu tempat."
      items={[
        {
          id: "dashboard",
          title: "Dashboard",
          description: "Metrik bisnis dan KPI utama workspace.",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          id: "campaign",
          title: "Campaign",
          description: "Kelola campaign marketing dan iklan.",
          href: "/campaigns",
          icon: Megaphone,
        },
        {
          id: "konten",
          title: "Konten",
          description: "Perpustakaan konten dan studio kreatif.",
          href: "/content",
          icon: PenLine,
        },
        {
          id: "analitik",
          title: "Analitik",
          description: "Analitik channel dan performa konten.",
          href: "/content/instagram-analytics",
          icon: BarChart3,
        },
      ]}
    />
  );
}

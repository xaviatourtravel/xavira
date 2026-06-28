import { BarChart3, LayoutDashboard, Megaphone, PenLine } from "lucide-react";

import { WorkspaceHubView } from "@/components/layout/workspace-hub-view";
import { requireProfile } from "@/lib/auth/session";

export default async function PerformancePage() {
  await requireProfile();

  return (
    <WorkspaceHubView
      title="Performa"
      subtitle="Lihat performa bisnis, campaign, content, dan insight operasional."
      items={[
        {
          title: "Dashboard",
          description: "Metrik bisnis dan KPI utama workspace.",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Campaign",
          description: "Kelola campaign marketing dan iklan.",
          href: "/campaigns",
          icon: Megaphone,
        },
        {
          title: "Content",
          description: "Perpustakaan konten dan studio kreatif.",
          href: "/content",
          icon: PenLine,
        },
        {
          title: "Analytics",
          description: "Analitik channel dan performa konten.",
          href: "/content/instagram-analytics",
          icon: BarChart3,
        },
      ]}
    />
  );
}

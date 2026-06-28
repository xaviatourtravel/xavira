import { CalendarDays, ListTodo, RefreshCw } from "lucide-react";

import { WorkspaceHubView } from "@/components/layout/workspace-hub-view";
import { requireProfile } from "@/lib/auth/session";

export default async function OperationsPage() {
  await requireProfile();

  return (
    <WorkspaceHubView
      title="Operasional"
      subtitle="Kelola task, follow up, dan aktivitas operasional tim."
      items={[
        {
          title: "Tasks",
          description: "Prioritas dan antrian kerja harian tim.",
          href: "/today",
          icon: ListTodo,
        },
        {
          title: "Follow Up",
          description: "Daftar follow up customer yang perlu ditindaklanjuti.",
          href: "/follow-ups",
          icon: RefreshCw,
        },
        {
          title: "Calendar",
          description: "Jadwal follow up dan aktivitas terjadwal.",
          href: "/follow-ups/queue",
          icon: CalendarDays,
        },
      ]}
    />
  );
}

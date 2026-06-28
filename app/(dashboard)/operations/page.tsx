import { CalendarDays, ListTodo, RefreshCw } from "lucide-react";

import { WorkspaceHubView } from "@/components/layout/workspace-hub-view";
import { requireProfile } from "@/lib/auth/session";

export default async function OperationsPage() {
  await requireProfile();

  return (
    <WorkspaceHubView
      title="Operasional"
      subtitle="Kelola task, follow up, jadwal, dan pekerjaan harian tim dalam satu workspace."
      items={[
        {
          id: "task",
          title: "Task",
          description: "Prioritas dan antrian kerja harian tim.",
          href: "/today",
          icon: ListTodo,
        },
        {
          id: "follow-up",
          title: "Follow Up",
          description: "Daftar follow up customer yang perlu ditindaklanjuti.",
          href: "/follow-ups",
          icon: RefreshCw,
        },
        {
          id: "kalender",
          title: "Kalender",
          description: "Jadwal follow up dan aktivitas terjadwal.",
          href: "/follow-ups/queue",
          icon: CalendarDays,
        },
      ]}
    />
  );
}

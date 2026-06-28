import { ComingSoonCreateView } from "@/components/layout/coming-soon-create-view";
import { requireProfile } from "@/lib/auth/session";

export default async function NewTaskPage() {
  await requireProfile();

  return (
    <ComingSoonCreateView
      title="Task Baru"
      description="Buat task operasional untuk tim Anda. Form ini akan terhubung ke antrian Hari Ini dan workspace Operasional."
      backHref="/operations"
      backLabel="Kembali ke Operasional"
    />
  );
}

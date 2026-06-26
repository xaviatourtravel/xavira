import { TodayWorkspaceView } from "@/components/today/today-workspace-view";
import { requireProfile } from "@/lib/auth/session";
import { loadTodayWorkspace } from "@/lib/tasks/load-today-workspace";

type TodayPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const { profile } = await requireProfile();
  const data = await loadTodayWorkspace(profile);
  const params = await searchParams;

  return (
    <div className="space-y-4">
      {params.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </div>
      ) : null}
      {params.success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {params.success}
        </div>
      ) : null}
      <TodayWorkspaceView data={data} />
    </div>
  );
}

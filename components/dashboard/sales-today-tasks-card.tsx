import Link from "next/link";

type SalesTodayTasksCardProps = {
  requiringFollowUp: number;
  overdueLeads: number;
  hotLeadsOverdue: number;
  dueTodayLeads: number;
};

export function SalesTodayTasksCard({
  requiringFollowUp,
  overdueLeads,
  hotLeadsOverdue,
  dueTodayLeads,
}: SalesTodayTasksCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Today&apos;s Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Prioritas follow up harian untuk lead yang di-assign ke Anda.
          </p>
        </div>
        <Link
          href="/follow-ups/queue?assigned=me"
          className="text-sm font-medium text-primary hover:underline"
        >
          Buka Queue
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/follow-ups/queue?assigned=me"
          className="rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-sm text-muted-foreground">Leads Requiring Follow Up</p>
          <p className="mt-2 text-2xl font-bold">{requiringFollowUp}</p>
        </Link>
        <Link
          href="/follow-ups/queue?assigned=me"
          className="rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-sm text-muted-foreground">Overdue Leads</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{overdueLeads}</p>
        </Link>
        <Link
          href="/follow-ups/queue?assigned=me"
          className="rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-sm text-muted-foreground">Hot Leads Overdue</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {hotLeadsOverdue}
          </p>
        </Link>
        <Link
          href="/follow-ups?filter=today&assigned=me"
          className="rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-sm text-muted-foreground">Due Today</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{dueTodayLeads}</p>
        </Link>
      </div>
    </div>
  );
}

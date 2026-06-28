import type { TodayActivityItem } from "@/lib/tasks/types";

type TodayActivityTimelineProps = {
  items: TodayActivityItem[];
};

function formatTimelineTime(timestamp: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}

export function TodayActivityTimelineSection({ items }: TodayActivityTimelineProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Activity Timeline
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          Aktivitas terbaru workspace
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Belum ada aktivitas tercatat hari ini. Aksi Anda akan muncul di sini.
        </p>
      ) : (
        <ol className="relative space-y-0">
          <div
            aria-hidden
            className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200"
          />
          {items.map((item) => (
            <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
              <span
                className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-slate-300 ring-1 ring-slate-200"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <time
                    dateTime={item.timestamp}
                    className="shrink-0 text-[11px] tabular-nums text-slate-400"
                  >
                    {formatTimelineTime(item.timestamp)}
                  </time>
                </div>
                {item.detail && item.detail !== item.label ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{item.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type LeadActivityItem = {
  id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  profiles:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};

type ActivityTimelineCardProps = {
  leadId: string;
  timeline: LeadActivityItem[];
  createLeadActivity: (formData: FormData) => Promise<void>;
};

type ActivityBadge = "AI" | "Follow Up" | "Booking" | "Payment" | "Activity";

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

const activityBadgeClassName: Record<ActivityBadge, string> = {
  AI: "bg-blue-100 text-blue-800",
  "Follow Up": "bg-indigo-100 text-indigo-800",
  Booking: "bg-emerald-100 text-emerald-800",
  Payment: "bg-amber-100 text-amber-800",
  Activity: "bg-slate-100 text-slate-700",
};

function getActorName(activity: LeadActivityItem) {
  if (!activity.profiles) {
    return "Sistem";
  }

  if (Array.isArray(activity.profiles)) {
    return activity.profiles[0]?.full_name ?? "Sistem";
  }

  return activity.profiles.full_name ?? "Sistem";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getActivityTitle(activity: LeadActivityItem) {
  const title = activity.title?.trim();
  return title || formatLabel(activity.activity_type);
}

function getActivityBadge(activity: LeadActivityItem): ActivityBadge {
  const title = activity.title?.trim() ?? "";

  if (/ai/i.test(title)) {
    return "AI";
  }

  if (/follow up/i.test(title)) {
    return "Follow Up";
  }

  if (/booking/i.test(title)) {
    return "Booking";
  }

  if (/payment/i.test(title)) {
    return "Payment";
  }

  return "Activity";
}

function shouldClampActivityBody(body: string) {
  const lineCount = body.split(/\r?\n/).length;
  return body.length > 180 || lineCount > 3;
}

export function ActivityTimelineCard({
  leadId,
  timeline,
  createLeadActivity,
}: ActivityTimelineCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas</CardTitle>
        <CardDescription>
          Riwayat interaksi dan catatan untuk lead ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={createLeadActivity} className="space-y-4 rounded-lg border p-4">
          <input type="hidden" name="lead_id" value={leadId} />

          <div>
            <label className="text-sm font-medium">Jenis Aktivitas</label>
            <select
              name="activity_type"
              defaultValue="note"
              className={inputClassName}
            >
              <option value="note">Catatan</option>
              <option value="call">Telepon</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Judul</label>
            <input
              name="title"
              className={inputClassName}
              placeholder="Contoh: Follow up harga paket"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Isi</label>
            <textarea
              name="body"
              rows={3}
              className={inputClassName}
              placeholder="Tulis detail aktivitas..."
            />
          </div>

          <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
            Tambah Aktivitas
          </button>
        </form>

        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada aktivitas untuk lead ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {timeline.map((activity) => {
              const badge = getActivityBadge(activity);
              const body = activity.body?.trim();

              return (
                <li key={activity.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                          activityBadgeClassName[badge],
                        )}
                      >
                        {badge}
                      </span>

                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold leading-snug">
                          {getActivityTitle(activity)}
                        </p>

                        {body && (
                          <p
                            className={cn(
                              "whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground",
                              shouldClampActivityBody(body) && "line-clamp-3",
                            )}
                          >
                            {body}
                          </p>
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          oleh {getActorName(activity)}
                        </p>
                      </div>
                    </div>

                    <time
                      dateTime={activity.occurred_at}
                      className="shrink-0 text-[11px] text-muted-foreground"
                    >
                      {formatDateTime(activity.occurred_at)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

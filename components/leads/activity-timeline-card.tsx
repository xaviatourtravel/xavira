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

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

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

export function ActivityTimelineCard({
  leadId,
  timeline,
  createLeadActivity,
}: ActivityTimelineCardProps) {
  return (
    <Card>
        <CardHeader>
          <CardTitle>Aktivitas</CardTitle>
          <CardDescription>Riwayat interaksi dan catatan untuk lead ini.</CardDescription>
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
            <ul className="space-y-4">
              {timeline.map((activity) => (
                <li key={activity.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">
                      {formatLabel(activity.activity_type)}
                      {activity.title ? `: ${activity.title}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(activity.occurred_at)}
                    </p>
                  </div>
                  {activity.body && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {activity.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    oleh {getActorName(activity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyRecommendationWhatsAppButton } from "@/components/leads/copy-recommendation-whatsapp-button";
import {
  formatRecommendationPriorityLabel,
  getLeadNextBestAction,
  getRecommendationWhatsAppSendUrl,
} from "@/lib/leads/next-best-action";
import { cn } from "@/lib/utils";

type AiRecommendationCardProps = {
  leadId: string;
  fullName: string;
  packageInterest: string | null;
  whatsappNumber: string | null;
  phone: string | null;
  status: string;
  updatedAt: string;
  hasPendingRecommendedTask: boolean;
  createFollowUpFromRecommendation: (formData: FormData) => Promise<void>;
};

const priorityClassName: Record<
  ReturnType<typeof getLeadNextBestAction>["priority"],
  string
> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export function AiRecommendationCard({
  leadId,
  fullName,
  packageInterest,
  whatsappNumber,
  phone,
  status,
  updatedAt,
  hasPendingRecommendedTask,
  createFollowUpFromRecommendation,
}: AiRecommendationCardProps) {
  const recommendation = getLeadNextBestAction({ status, updatedAt });
  const whatsAppSendUrl = getRecommendationWhatsAppSendUrl({
    status,
    fullName,
    packageInterest,
    whatsappNumber,
    phone,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Recommendation</CardTitle>
        <CardDescription>
          Rekomendasi tindakan berikutnya berdasarkan status lead.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{recommendation.title}</p>
            <p className="text-sm text-muted-foreground">
              {recommendation.text}
            </p>
          </div>

          <span
            className={cn(
              "shrink-0 rounded px-2 py-1 text-xs font-medium",
              priorityClassName[recommendation.priority],
            )}
          >
            {formatRecommendationPriorityLabel(recommendation.priority)}
          </span>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <CopyRecommendationWhatsAppButton
            status={status}
            fullName={fullName}
            packageInterest={packageInterest}
          />

          {whatsAppSendUrl ? (
            <a
              href={whatsAppSendUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md bg-green-600 px-4 py-2 text-sm text-white"
            >
              Buka WhatsApp
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">
              Nomor WhatsApp belum ada
            </span>
          )}

          {hasPendingRecommendedTask ? (
            <p className="text-xs text-muted-foreground">
              Follow up rekomendasi sudah dijadwalkan.
            </p>
          ) : (
            <form action={createFollowUpFromRecommendation}>
              <input type="hidden" name="lead_id" value={leadId} />
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Buat Follow Up
              </button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

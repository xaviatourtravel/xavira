import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LeadHealthScoreResult } from "@/lib/leads/health-score";
import { cn } from "@/lib/utils";

type LeadHealthScoreCardProps = {
  healthScore: LeadHealthScoreResult;
};

const badgeClassName: Record<LeadHealthScoreResult["badge"], string> = {
  Excellent: "bg-emerald-100 text-emerald-800",
  Healthy: "bg-blue-100 text-blue-800",
  "Attention Needed": "bg-amber-100 text-amber-800",
  Critical: "bg-red-100 text-red-800",
};

export function LeadHealthScoreCard({ healthScore }: LeadHealthScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Health Score</CardTitle>
        <CardDescription>
          Skor kesehatan lead berdasarkan assignment, follow up, dan aktivitas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-3xl font-semibold tabular-nums">
            {healthScore.score}
          </p>

          <span
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium",
              badgeClassName[healthScore.badge],
            )}
          >
            {healthScore.badge}
          </span>
        </div>

        {healthScore.reasons.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Top reasons affecting score
            </p>

            <ul className="space-y-1.5">
              {healthScore.reasons.map((reason) => (
                <li
                  key={`${reason.label}-${reason.impact}`}
                  className="flex items-start gap-2 text-xs"
                >
                  <span
                    className={cn(
                      "shrink-0 font-medium",
                      reason.impact > 0
                        ? "text-emerald-700"
                        : "text-red-600",
                    )}
                  >
                    {reason.impact > 0 ? "+" : "-"}
                  </span>
                  <span className="text-muted-foreground">{reason.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

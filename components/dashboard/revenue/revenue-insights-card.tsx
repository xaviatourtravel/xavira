"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateRevenueInsights } from "@/app/(dashboard)/revenue/actions";
import type { RevenueInsight } from "@/lib/ai/revenue-insights";

type RevenueInsightsCardProps = {
  canGenerate: boolean;
  hasData: boolean;
};

export function RevenueInsightsCard({
  canGenerate,
  hasData,
}: RevenueInsightsCardProps) {
  const [insights, setInsights] = useState<RevenueInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateRevenueInsights();
      setHasGenerated(true);
      if (result.success) {
        setInsights(result.insights);
      } else {
        setInsights([]);
        setError(result.message);
      }
    });
  }

  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Business Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            Insight otomatis berdasarkan metrik aktual lead dan booking.
          </p>
        </div>

        {canGenerate ? (
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={isPending || !hasData}
          >
            {isPending
              ? "Menganalisis..."
              : hasGenerated
                ? "Generate ulang"
                : "Generate insights"}
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        {!canGenerate ? (
          <p className="text-sm text-muted-foreground">
            Hanya owner atau admin yang dapat membuat insight.
          </p>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground">
            Belum ada data lead atau booking untuk dianalisis.
          </p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : insights.length > 0 ? (
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li
                key={`${index}-${insight.title}`}
                className="rounded-lg border bg-muted/30 p-4"
              >
                <p className="font-medium">{insight.title}</p>
                {insight.detail ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Klik &quot;Generate insights&quot; untuk mendapatkan analisis AI tentang
            sumber lead terbaik, paket terlaris, dan performa sales.
          </p>
        )}
      </div>
    </div>
  );
}

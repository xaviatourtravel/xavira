"use client";

import { useState, useTransition } from "react";
import { Copy, RefreshCw, Sparkles } from "lucide-react";

import { generateCustomerAiSummaryAction } from "@/app/(dashboard)/customers/[id]/ai-actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomerAiSummary } from "@/lib/ai/customer-summary";
import { cn } from "@/lib/utils";

type CustomerAiSummaryPanelProps = {
  leadId: string;
  initialSummary?: CustomerAiSummary | null;
  hasMinimalContext?: boolean;
};

const intentClassName = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-emerald-100 text-emerald-800",
} as const;

const temperatureClassName = {
  Cold: "bg-sky-100 text-sky-800",
  Warm: "bg-orange-100 text-orange-800",
  Hot: "bg-red-100 text-red-800",
} as const;

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function SummaryCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function CustomerAiSummaryPanel({
  leadId,
  initialSummary = null,
  hasMinimalContext = true,
}: CustomerAiSummaryPanelProps) {
  const [summary, setSummary] = useState<CustomerAiSummary | null>(
    initialSummary,
  );
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [editableMessage, setEditableMessage] = useState(
    initialSummary?.suggestedFollowUpMessage ?? "",
  );
  const [isPending, startTransition] = useTransition();

  function runGeneration(forceRegenerate: boolean) {
    startTransition(async () => {
      setError(null);
      setCopyFeedback(null);

      const formData = new FormData();
      formData.set("lead_id", leadId);
      if (forceRegenerate) {
        formData.set("force_regenerate", "true");
      }

      const result = await generateCustomerAiSummaryAction(formData);

      if (!result.success) {
        setError(result.message ?? "Gagal membuat ringkasan customer.");
        return;
      }

      if (result.data) {
        setSummary(result.data);
        setEditableMessage(result.data.suggestedFollowUpMessage);
      }
    });
  }

  async function handleCopyMessage() {
    if (!editableMessage.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(editableMessage);
      setCopyFeedback("Pesan disalin.");
    } catch {
      setCopyFeedback("Gagal menyalin pesan.");
    }
  }

  const showEmptyState =
    !isPending && !summary && (!hasMinimalContext || error?.includes("Not enough"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">AI Customer Summary</h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan customer, intent, missing info, dan rekomendasi langkah berikutnya.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending || !hasMinimalContext}
            onClick={() => runGeneration(false)}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Sparkles className="h-4 w-4" />
            Generate Summary
          </button>

          {summary ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runGeneration(true)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
              Regenerate
            </button>
          ) : null}
        </div>
      </div>

      {isPending ? (
        <div className="rounded-2xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          Analyzing customer context…
        </div>
      ) : null}

      {error && !isPending ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : null}

      {showEmptyState ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
          Not enough customer context yet. Add notes or continue the conversation to
          generate a better summary.
        </div>
      ) : null}

      {summary && !isPending ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <SummaryCard title="Customer Summary">
              <p className="text-sm leading-relaxed">{summary.customerSummary}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Generated {formatGeneratedAt(summary.generatedAt)}
              </p>
            </SummaryCard>

            <SummaryCard
              title="Lead Intent"
              description="Travel interest extracted from available customer data."
            >
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    intentClassName[summary.intentLevel],
                  )}
                >
                  Intent: {summary.intentLevel}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    temperatureClassName[summary.leadTemperature],
                  )}
                >
                  Temperature: {summary.leadTemperature}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Destination interest</dt>
                  <dd className="font-medium">
                    {summary.destinationInterest ?? "Belum tersedia"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Travel date / month</dt>
                  <dd className="font-medium">
                    {summary.travelDateOrMonth ?? "Belum tersedia"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pax</dt>
                  <dd className="font-medium">
                    {summary.pax != null ? summary.pax : "Belum tersedia"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd className="font-medium">
                    {summary.budget ?? "Belum tersedia"}
                  </dd>
                </div>
              </dl>
            </SummaryCard>

            <SummaryCard title="Missing Information">
              {summary.missingFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Semua field utama sudah terisi.
                </p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {summary.missingFields.map((field) => (
                    <li key={field} className="capitalize">
                      {field}
                    </li>
                  ))}
                </ul>
              )}
            </SummaryCard>
          </div>

          <div className="space-y-6">
            <SummaryCard title="Next Best Action">
              <p className="text-sm leading-relaxed">{summary.nextBestAction}</p>
            </SummaryCard>

            <SummaryCard
              title="Suggested Message"
              description="Draf follow-up dalam Bahasa Indonesia. Salin manual — tidak dikirim otomatis."
            >
              <textarea
                value={editableMessage}
                onChange={(event) => setEditableMessage(event.target.value)}
                rows={8}
                className="w-full rounded-md border px-3 py-2 text-sm leading-relaxed"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  <Copy className="h-4 w-4" />
                  Copy Suggested Message
                </button>
                {copyFeedback ? (
                  <span className="text-sm text-emerald-700">{copyFeedback}</span>
                ) : null}
              </div>
            </SummaryCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}

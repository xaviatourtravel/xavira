"use client";

import { useMemo, useState, useTransition } from "react";

import {
  generateAiLeadIntelligence,
  generateAiSalesAssistant,
} from "@/app/(dashboard)/leads/[id]/ai-actions";
import { CopyRecommendationWhatsAppButton } from "@/components/leads/copy-recommendation-whatsapp-button";
import {
  getLeadIntelligenceBadgeClassName,
  getLeadIntelligenceCategoryLabel,
  type LeadIntelligenceResult,
} from "@/lib/ai/lead-intelligence";
import {
  getSalesAssistantActionLabel,
  SALES_ASSISTANT_ACTIONS,
  type SalesAssistantAction,
} from "@/lib/ai/sales-assistant";
import {
  formatRecommendationPriorityLabel,
  getLeadNextBestAction,
  getLeadWhatsAppPhone,
  getRecommendationWhatsAppSendUrl,
} from "@/lib/leads/next-best-action";
import { cn } from "@/lib/utils";

type AiSalesIntelligencePanelProps = {
  leadId: string;
  fullName: string;
  packageInterest: string | null;
  whatsappNumber: string | null;
  phone: string | null;
  status: string;
  updatedAt: string;
  hasPendingRecommendedTask: boolean;
  createFollowUpFromRecommendation: (formData: FormData) => Promise<void>;
  initialIntelligence: LeadIntelligenceResult | null;
};

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

const priorityClassName: Record<
  ReturnType<typeof getLeadNextBestAction>["priority"],
  string
> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export function AiSalesIntelligencePanel({
  leadId,
  fullName,
  packageInterest,
  whatsappNumber,
  phone,
  status,
  updatedAt,
  hasPendingRecommendedTask,
  createFollowUpFromRecommendation,
  initialIntelligence,
}: AiSalesIntelligencePanelProps) {
  const [intelligence, setIntelligence] =
    useState<LeadIntelligenceResult | null>(initialIntelligence);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(
    null,
  );
  const [isIntelligencePending, startIntelligenceTransition] = useTransition();

  const [action, setAction] = useState<SalesAssistantAction>("follow_up");
  const [customerContext, setCustomerContext] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isAssistantPending, startAssistantTransition] = useTransition();

  const recommendation = getLeadNextBestAction({ status, updatedAt });
  const recommendationWhatsAppUrl = getRecommendationWhatsAppSendUrl({
    status,
    fullName,
    packageInterest,
    whatsappNumber,
    phone,
  });

  const draftWhatsAppUrl = useMemo(() => {
    const cleanPhone = getLeadWhatsAppPhone(whatsappNumber, phone);

    if (!cleanPhone || !draftMessage) {
      return null;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draftMessage)}`;
  }, [draftMessage, phone, whatsappNumber]);

  function runIntelligenceGeneration(forceRegenerate: boolean) {
    setIntelligenceError(null);

    const formData = new FormData();
    formData.set("lead_id", leadId);
    formData.set("force_regenerate", forceRegenerate ? "true" : "false");

    startIntelligenceTransition(async () => {
      const result = await generateAiLeadIntelligence(formData);

      if (!result.success || !result.data) {
        setIntelligenceError(result.message ?? "Gagal menganalisis lead.");
        return;
      }

      setIntelligence(result.data);
    });
  }

  function handleGenerateDraft() {
    setAssistantError(null);

    const formData = new FormData();
    formData.set("lead_id", leadId);
    formData.set("action", action);
    formData.set("customer_context", customerContext);

    startAssistantTransition(async () => {
      const result = await generateAiSalesAssistant(formData);

      if (!result.success) {
        setAssistantError(result.message);
        return;
      }

      setDraftMessage(result.message);
    });
  }

  async function handleCopyDraft() {
    try {
      await navigator.clipboard.writeText(draftMessage);
      setCopyFeedback("Pesan berhasil disalin.");
    } catch {
      setCopyFeedback("Gagal menyalin pesan.");
    }

    window.setTimeout(() => {
      setCopyFeedback(null);
    }, 3000);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runIntelligenceGeneration(Boolean(intelligence))}
            disabled={isIntelligencePending}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isIntelligencePending
              ? "Menganalisis lead..."
              : intelligence
                ? "Regenerate Analysis"
                : "Generate Analysis"}
          </button>
        </div>

        {intelligenceError && (
          <p className="text-sm text-red-600">{intelligenceError}</p>
        )}

        {isIntelligencePending && !intelligence && (
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              Menganalisis kualitas lead dan rekomendasi tindakan...
            </p>
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        )}

        {intelligence && (
          <div
            className={cn("space-y-5", isIntelligencePending && "opacity-60")}
          >
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Lead Summary</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {intelligence.summary}
              </p>
              {intelligence.insufficientData && (
                <p className="text-xs text-amber-700">
                  Data lead masih terbatas. Hasil analisis bisa berubah setelah
                  ada aktivitas atau catatan tambahan.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Lead Score</h3>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
                <p className="text-3xl font-bold tabular-nums">
                  {intelligence.score}
                </p>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium",
                    getLeadIntelligenceBadgeClassName(intelligence.category),
                  )}
                >
                  {getLeadIntelligenceCategoryLabel(intelligence.category)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Reasoning</h3>
              <ul className="space-y-1.5">
                {intelligence.reasoning.map((reason) => (
                  <li
                    key={reason}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">AI Recommended Action</h3>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  {intelligence.nextBestAction}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {intelligence.cached ? "Cached" : "Generated"} ·{" "}
              {formatGeneratedAt(intelligence.generatedAt)}
            </p>
          </div>
        )}

        {!intelligence && !isIntelligencePending && !intelligenceError && (
          <p className="text-sm text-muted-foreground">
            Generate analysis untuk melihat ringkasan lead, skor, reasoning, dan
            rekomendasi berbasis AI.
          </p>
        )}
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h3 className="text-sm font-semibold">Recommended Actions</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Rekomendasi tindakan berdasarkan status dan aktivitas lead saat ini.
          </p>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
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

          {recommendationWhatsAppUrl ? (
            <a
              href={recommendationWhatsAppUrl}
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
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h3 className="text-sm font-semibold">AI Sales Assistant Actions</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Buat draf pesan WhatsApp berdasarkan konteks lead. Pesan tidak
            dikirim otomatis.
          </p>
        </div>

        <div>
          <label htmlFor="sales_assistant_action" className="text-sm font-medium">
            Pilih Aksi
          </label>
          <select
            id="sales_assistant_action"
            name="action"
            value={action}
            onChange={(event) =>
              setAction(event.target.value as SalesAssistantAction)
            }
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {SALES_ASSISTANT_ACTIONS.map((item) => (
              <option key={item} value={item}>
                {getSalesAssistantActionLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="customer_context" className="text-sm font-medium">
            Customer terakhir tanya apa?
          </label>
          <textarea
            id="customer_context"
            name="customer_context"
            value={customerContext}
            onChange={(event) => setCustomerContext(event.target.value)}
            rows={3}
            placeholder="Opsional. Contoh: tanya jadwal keberangkatan Februari dan apakah masih ada kuota."
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerateDraft}
          disabled={isAssistantPending}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isAssistantPending ? "Membuat draf..." : "Buat Draf Pesan"}
        </button>

        {assistantError && (
          <p className="text-sm text-red-600">{assistantError}</p>
        )}

        {draftMessage && (
          <div className="space-y-3">
            <textarea
              readOnly
              value={draftMessage}
              rows={10}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyDraft}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Salin Pesan
              </button>

              {draftWhatsAppUrl && (
                <a
                  href={draftWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm text-white"
                >
                  Buka WhatsApp
                </a>
              )}
            </div>

            {copyFeedback && (
              <p
                className={
                  copyFeedback.includes("Gagal")
                    ? "text-xs text-red-600"
                    : "text-xs text-green-700"
                }
              >
                {copyFeedback}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";

import { generateAiReplyAssistant } from "@/app/(dashboard)/leads/[id]/ai-actions";
import {
  getReplyAssistantTypeLabel,
  REPLY_ASSISTANT_TYPES,
  type ReplyAssistantType,
} from "@/lib/ai/reply-assistant";
import { getLeadWhatsAppPhone } from "@/lib/leads/next-best-action";

type AiReplyAssistantGeneratorProps = {
  leadId: string;
  whatsappNumber: string | null;
  phone: string | null;
};

export function AiReplyAssistantGenerator({
  leadId,
  whatsappNumber,
  phone,
}: AiReplyAssistantGeneratorProps) {
  const [replyType, setReplyType] = useState<ReplyAssistantType>("follow_up");
  const [customerContext, setCustomerContext] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const whatsAppSendUrl = useMemo(() => {
    const cleanPhone = getLeadWhatsAppPhone(whatsappNumber, phone);

    if (!cleanPhone || !message) {
      return null;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }, [message, phone, whatsappNumber]);

  function handleGenerate() {
    setError(null);

    const formData = new FormData();
    formData.set("lead_id", leadId);
    formData.set("reply_type", replyType);
    formData.set("customer_context", customerContext);

    startTransition(async () => {
      const result = await generateAiReplyAssistant(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyFeedback("Pesan berhasil disalin.");
    } catch {
      setCopyFeedback("Gagal menyalin pesan.");
    }

    window.setTimeout(() => {
      setCopyFeedback(null);
    }, 3000);
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="reply_type" className="text-sm font-medium">
          Jenis Balasan
        </label>
        <select
          id="reply_type"
          name="reply_type"
          value={replyType}
          onChange={(event) =>
            setReplyType(event.target.value as ReplyAssistantType)
          }
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          {REPLY_ASSISTANT_TYPES.map((type) => (
            <option key={type} value={type}>
              {getReplyAssistantTypeLabel(type)}
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
          placeholder="Contoh: tanya jadwal keberangkatan Februari dan apakah masih ada kuota."
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {isPending ? "Membuat draf..." : "Buat Draf Balasan"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {message && (
        <div className="space-y-3">
          <textarea
            readOnly
            value={message}
            rows={10}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
            >
              Salin Pesan
            </button>

            {whatsAppSendUrl && (
              <a
                href={whatsAppSendUrl}
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
    </div>
  );
}

"use client";

import { useState } from "react";

import { getRecommendationWhatsAppDraft } from "@/lib/leads/next-best-action";

type CopyRecommendationWhatsAppButtonProps = {
  status: string;
  fullName: string;
  packageInterest?: string | null;
};

export function CopyRecommendationWhatsAppButton({
  status,
  fullName,
  packageInterest,
}: CopyRecommendationWhatsAppButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleCopy() {
    const message = getRecommendationWhatsAppDraft({
      status,
      fullName,
      packageInterest,
    });

    try {
      await navigator.clipboard.writeText(message);
      setFeedback("Pesan WhatsApp disalin.");
    } catch {
      setFeedback("Gagal menyalin pesan.");
    }

    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
      >
        Copy Pesan WA
      </button>

      {feedback && (
        <p
          className={
            feedback.includes("Gagal")
              ? "text-xs text-red-600"
              : "text-xs text-green-700"
          }
        >
          {feedback}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";

import { generateAiFollowUp } from "@/app/(dashboard)/leads/[id]/ai-actions";

export function AiFollowUpGenerator({
  leadId,
}: {
  leadId: string;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    const formData = new FormData();
    formData.set("lead_id", leadId);

    startTransition(async () => {
      const result = await generateAiFollowUp(formData);

      if (!result.success) {
        alert(result.message);
        return;
      }

      setMessage(result.message);
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    alert("Follow up berhasil disalin.");
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {isPending ? "Generating..." : "Generate Follow Up AI"}
      </button>

      {message && (
        <div className="space-y-3">
          <textarea
            readOnly
            value={message}
            rows={8}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Copy Follow Up
          </button>
        </div>
      )}
    </div>
  );
}
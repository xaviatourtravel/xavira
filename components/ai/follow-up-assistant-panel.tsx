"use client";

import { useState, useTransition } from "react";

import {
  generateBookingPaymentReminderAssistant,
  generateInboxFollowUpAssistant,
  generateLeadFollowUpAssistant,
  saveFollowUpAssistantNote,
} from "@/app/(dashboard)/ai/follow-up-assistant-actions";
import {
  FOLLOW_UP_ASSISTANT_TONES,
  formatFollowUpAssistantToneLabel,
  type FollowUpAssistantTone,
} from "@/lib/ai/follow-up-assistant";

type FollowUpAssistantPanelProps = {
  mode: "lead" | "booking" | "inbox";
  leadId?: string;
  bookingId?: string;
  conversationId?: string;
  canSaveNote?: boolean;
  title?: string;
  description?: string;
  generateLabel?: string;
  regenerateLabel?: string;
  reminderTypeHint?: string | null;
};

export function FollowUpAssistantPanel({
  mode,
  leadId,
  bookingId,
  conversationId,
  canSaveNote = true,
  title,
  description,
  generateLabel = "Generate Follow-Up",
  regenerateLabel = "Regenerate",
  reminderTypeHint = null,
}: FollowUpAssistantPanelProps) {
  const [tone, setTone] = useState<FollowUpAssistantTone>("professional");
  const [suggestion, setSuggestion] = useState("");
  const [reminderType, setReminderType] = useState<string | null>(
    reminderTypeHint,
  );
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  function handleGenerate(forceRegenerate: boolean) {
    setError(null);
    setFeedback(null);

    if (forceRegenerate && !suggestion) {
      return handleGenerate(false);
    }

    const formData = new FormData();
    formData.set("tone", tone);

    if (mode === "lead" && leadId) {
      formData.set("lead_id", leadId);
    } else if (mode === "booking" && bookingId) {
      formData.set("booking_id", bookingId);
    } else if (mode === "inbox" && conversationId) {
      formData.set("conversation_id", conversationId);
    } else {
      setError("Context tidak lengkap.");
      return;
    }

    startGenerateTransition(async () => {
      const result =
        mode === "booking"
          ? await generateBookingPaymentReminderAssistant(formData)
          : mode === "inbox"
            ? await generateInboxFollowUpAssistant(formData)
            : await generateLeadFollowUpAssistant(formData);

      if (!result.success || !result.suggestion) {
        setError(result.message ?? "Gagal membuat draf.");
        return;
      }

      setSuggestion(result.suggestion);
      setReminderType(result.reminderType ?? reminderTypeHint);
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(suggestion);
      setFeedback("Pesan disalin ke clipboard.");
    } catch {
      setFeedback("Gagal menyalin pesan.");
    }
  }

  function handleSaveNote() {
    if (!suggestion.trim()) {
      setError("Tidak ada pesan untuk disimpan.");
      return;
    }

    setError(null);
    setFeedback(null);

    const formData = new FormData();
    formData.set("body", suggestion);
    formData.set(
      "title",
      mode === "booking" ? "AI Payment Reminder Draft" : "AI Follow-Up Draft",
    );

    if (leadId) {
      formData.set("lead_id", leadId);
    }

    if (bookingId) {
      formData.set("booking_id", bookingId);
    }

    startSaveTransition(async () => {
      const result = await saveFollowUpAssistantNote(formData);

      if (!result.success) {
        setError(result.message ?? "Gagal menyimpan catatan.");
        return;
      }

      setFeedback("Disimpan sebagai catatan lead.");
    });
  }

  return (
    <div className="space-y-4">
      {title && (
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor={`tone-${mode}-${leadId ?? bookingId ?? conversationId}`} className="text-sm font-medium">
          Tone
        </label>
        <select
          id={`tone-${mode}-${leadId ?? bookingId ?? conversationId}`}
          value={tone}
          onChange={(event) =>
            setTone(event.target.value as FollowUpAssistantTone)
          }
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          {FOLLOW_UP_ASSISTANT_TONES.map((option) => (
            <option key={option} value={option}>
              {formatFollowUpAssistantToneLabel(option)}
            </option>
          ))}
        </select>
      </div>

      {reminderType && (
        <p className="text-xs text-muted-foreground">
          Reminder type: {reminderType}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleGenerate(false)}
          disabled={isGenerating}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : generateLabel}
        </button>

        {suggestion && (
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          >
            {isGenerating ? "Regenerating..." : regenerateLabel}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Draft only — review before sending. No automatic messages.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {suggestion && (
        <div className="space-y-3">
          <textarea
            value={suggestion}
            onChange={(event) => setSuggestion(event.target.value)}
            rows={8}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
            >
              Copy
            </button>

            {canSaveNote && (
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isSaving}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save as Note"}
              </button>
            )}

            <button
              type="button"
              disabled
              title="Coming soon"
              className="cursor-not-allowed rounded-md border px-4 py-2 text-sm text-muted-foreground opacity-60"
            >
              Send via Inbox (soon)
            </button>
          </div>

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
      )}
    </div>
  );
}

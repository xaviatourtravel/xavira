"use client";

import { useState, useTransition } from "react";

import { generateInboxChatReply } from "@/app/(dashboard)/inbox/ai-actions";
import { Button } from "@/components/ui/button";

type InboxChatAssistantPanelProps = {
  conversationId: string;
  defaultIncomingMessage: string;
  hasLinkedLead: boolean;
  packageName: string | null;
};

export function InboxChatAssistantPanel({
  conversationId,
  defaultIncomingMessage,
  hasLinkedLead,
  packageName,
}: InboxChatAssistantPanelProps) {
  const [incomingMessage, setIncomingMessage] = useState(defaultIncomingMessage);
  const [draftReply, setDraftReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerateReply() {
    setError(null);

    const formData = new FormData();
    formData.set("conversation_id", conversationId);
    formData.set("incoming_message", incomingMessage);

    startTransition(async () => {
      const result = await generateInboxChatReply(formData);

      if (!result.success) {
        setError(result.message ?? "Gagal membuat draf balasan.");
        return;
      }

      setDraftReply(result.message ?? "");
    });
  }

  async function handleCopyDraft() {
    if (!draftReply) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draftReply);
      setCopyFeedback("Balasan berhasil disalin.");
    } catch {
      setCopyFeedback("Gagal menyalin balasan.");
    }

    window.setTimeout(() => {
      setCopyFeedback(null);
    }, 3000);
  }

  return (
    <div className="rounded-xl border p-6">
      <div>
        <h2 className="text-lg font-semibold">✨ Generate Reply</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat draf balasan berdasarkan pesan masuk
          {hasLinkedLead ? ", data lead," : ""}
          {packageName ? " dan paket terkait." : "."} Pesan tidak dikirim
          otomatis — salin manual ke DM.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="incoming_message" className="text-sm font-medium">
            Pesan Masuk
          </label>
          <textarea
            id="incoming_message"
            value={incomingMessage}
            onChange={(event) => setIncomingMessage(event.target.value)}
            rows={4}
            placeholder="Tempel atau edit pesan terakhir dari pelanggan..."
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {(hasLinkedLead || packageName) && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {hasLinkedLead && <p>Data lead CRM akan digunakan jika tersedia.</p>}
            {packageName && (
              <p>Paket terkait: {packageName}</p>
            )}
          </div>
        )}

        <Button
          type="button"
          onClick={handleGenerateReply}
          disabled={isPending || !incomingMessage.trim()}
        >
          {isPending ? "Membuat draf..." : "Generate Reply"}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {draftReply && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Draf Balasan</p>
              <p className="text-xs text-muted-foreground">
                Review draf sebelum disalin ke Instagram/Facebook DM.
              </p>
            </div>

            <textarea
              readOnly
              value={draftReply}
              rows={8}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={handleCopyDraft}>
                Salin Pesan
              </Button>

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
          </div>
        )}
      </div>
    </div>
  );
}

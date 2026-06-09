"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ScriptCopyButtonProps = {
  text: string;
};

export function ScriptCopyButton({ text }: ScriptCopyButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Script disalin.");
    } catch {
      setFeedback("Gagal menyalin script.");
    }

    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        Copy Script
      </Button>

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

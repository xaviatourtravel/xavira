"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";

import {
  InspectorAction,
  InspectorEmpty,
} from "@/components/ui/inspector";
import { DsToast } from "@/components/design-system/toast";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { useInboxComposer } from "@/modules/inbox/context/inbox-composer-context";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import {
  generateSuggestedReply,
  getSuggestedReplyRefreshKey,
  type ReplyVariant,
} from "@/modules/inbox/lib/suggested-reply-engine";

type AiSuggestedReplyCardProps = {
  conversation: OmnichannelConversationDetail;
  hideHeader?: boolean;
};

export function AiSuggestedReplyCard({
  conversation,
  hideHeader = false,
}: AiSuggestedReplyCardProps) {
  const { ti, locale } = useInboxTranslation();
  const { insertText } = useInboxComposer();

  const [variant, setVariant] = useState<ReplyVariant>("default");
  const [regenerateSeed, setRegenerateSeed] = useState(0);
  const [draftText, setDraftText] = useState("");
  const [toast, setToast] = useState<{ title: string } | null>(null);

  const refreshKey = getSuggestedReplyRefreshKey(conversation);
  const lastRefreshKeyRef = useRef(refreshKey);
  const isEditingRef = useRef(false);

  const result = generateSuggestedReply({
    conversation,
    locale,
    variant,
    regenerateSeed,
  });

  const syncGeneratedText = useCallback(() => {
    if (!result.canGenerate) {
      setDraftText("");
      return;
    }
    if (!isEditingRef.current) {
      setDraftText(result.text);
    }
  }, [result.canGenerate, result.text]);

  useEffect(() => {
    if (refreshKey !== lastRefreshKeyRef.current) {
      lastRefreshKeyRef.current = refreshKey;
      isEditingRef.current = false;
      setVariant("default");
      setRegenerateSeed(0);
    }
    syncGeneratedText();
  }, [refreshKey, syncGeneratedText]);

  useEffect(() => {
    if (!isEditingRef.current) {
      setDraftText(result.text);
    }
  }, [result.text]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleRegenerate() {
    isEditingRef.current = false;
    setVariant("default");
    setRegenerateSeed((value) => value + 1);
  }

  function handleVariant(next: ReplyVariant) {
    isEditingRef.current = false;
    setVariant(next);
  }

  async function handleCopy() {
    if (!draftText.trim()) return;
    try {
      await navigator.clipboard.writeText(draftText);
      setToast({ title: ti("copySuccess") });
    } catch {
      setToast({ title: ti("copyFailed") });
    }
  }

  function handleInsert() {
    if (!draftText.trim()) return;
    insertText(draftText);
    setToast({ title: ti("insertSuccess") });
  }

  if (!result.canGenerate) {
    return (
      <InspectorEmpty
        icon={Sparkles}
        title={ti("emptyNoSuggestion")}
        description={ti("emptyNoSuggestionDesc")}
        action={
          <Link
            href="/business-brain"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ti("openBusinessBrain")}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {!hideHeader ? (
        <p className="text-xs text-muted-foreground">{ti("suggestedReply")}</p>
      ) : null}

      <textarea
        value={draftText}
        onChange={(event) => {
          isEditingRef.current = true;
          setDraftText(event.target.value);
        }}
        rows={5}
        className="w-full resize-y rounded-xl bg-muted/15 px-0 py-1 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:ring-0 dark:bg-transparent"
      />

      <p className="text-[11px] text-muted-foreground">
        {result.confidence}% · {ti(result.confidenceLabelKey)}
      </p>

      <InspectorAction variant="primary" onClick={handleInsert} disabled={!draftText.trim()} className="w-full">
        {ti("insertToComposer")}
      </InspectorAction>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!draftText.trim()}
          className="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:opacity-40"
        >
          {ti("copy")}
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          className="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {ti("regenerate")}
        </button>
        <button
          type="button"
          onClick={() => handleVariant("short")}
          className="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {ti("shorter")}
        </button>
        <button
          type="button"
          onClick={() => handleVariant("friendly")}
          className="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {ti("moreFriendly")}
        </button>
      </div>

      {result.sources.some((source) => source.active) ? (
        <p className="text-[11px] text-muted-foreground">
          {ti("generatedFrom")}{" "}
          {result.sources
            .filter((source) => source.active)
            .map((source) => ti(source.labelKey))
            .join(" · ")}
        </p>
      ) : null}

      {toast ? (
        <div className="relative">
          <div className="pointer-events-none absolute bottom-0 right-0 z-20 flex justify-end pb-1">
            <div className="pointer-events-auto">
              <DsToast variant="success" title={toast.title} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

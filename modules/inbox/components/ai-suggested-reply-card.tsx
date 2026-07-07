"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Sparkles } from "lucide-react";

import {
  InspectorAction,
  InspectorEmpty,
  InspectorBadge,
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
import { cn } from "@/lib/utils";

type AiSuggestedReplyCardProps = {
  conversation: OmnichannelConversationDetail;
  hideHeader?: boolean;
};

const CONFIDENCE_TONES = {
  high: "success",
  medium: "warning",
  low: "neutral",
} as const;

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
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {ti("suggestedReply")}
          </p>
          <InspectorBadge tone={CONFIDENCE_TONES[result.confidenceLevel]} size="xs">
            {result.confidence}% · {ti(result.confidenceLabelKey)}
          </InspectorBadge>
        </div>
      ) : (
        <div className="flex justify-end">
          <InspectorBadge tone={CONFIDENCE_TONES[result.confidenceLevel]} size="xs">
            {result.confidence}% · {ti(result.confidenceLabelKey)}
          </InspectorBadge>
        </div>
      )}

      <textarea
        value={draftText}
        onChange={(event) => {
          isEditingRef.current = true;
          setDraftText(event.target.value);
        }}
        rows={5}
        className="w-full resize-y rounded-lg bg-muted/20 px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none transition-colors focus-visible:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-muted/15"
      />

      <div className="flex flex-wrap gap-1.5">
        <InspectorAction variant="primary" onClick={handleInsert} disabled={!draftText.trim()}>
          {ti("insertToComposer")}
        </InspectorAction>
        <InspectorAction variant="ghost" onClick={() => void handleCopy()} disabled={!draftText.trim()}>
          <Copy className="h-3 w-3" />
          {ti("copy")}
        </InspectorAction>
        <InspectorAction variant="ghost" onClick={handleRegenerate}>{ti("regenerate")}</InspectorAction>
        <InspectorAction variant="ghost" onClick={() => handleVariant("short")}>{ti("shorter")}</InspectorAction>
        <InspectorAction variant="ghost" onClick={() => handleVariant("persuasive")}>
          {ti("morePersuasive")}
        </InspectorAction>
        <InspectorAction variant="ghost" onClick={() => handleVariant("friendly")}>{ti("moreFriendly")}</InspectorAction>
        <InspectorAction variant="ghost" onClick={() => handleVariant("professional")}>
          {ti("moreProfessional")}
        </InspectorAction>
        <InspectorAction variant="ghost" disabled title={ti("comingSoon")}>
          {ti("translate")}
        </InspectorAction>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">{ti("generatedFrom")}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {result.sources.map((source) => (
            <Link
              key={source.key}
              href={source.href}
              className={cn(
                "inline-flex items-center gap-1 text-xs transition-colors hover:text-foreground",
                source.active
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {source.active ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : null}
              {ti(source.labelKey)}
            </Link>
          ))}
        </div>
      </div>

      {result.confidence < 70 && result.missingContext.length > 0 ? (
        <div className="text-xs text-muted-foreground">
          <p>{ti("incompleteReplyWarning")}</p>
          <ul className="mt-1 space-y-0.5">
            {result.missingContext.map((item) => (
              <li key={item}>· {ti(result.missingContextLabelKeys[item])}</li>
            ))}
          </ul>
        </div>
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

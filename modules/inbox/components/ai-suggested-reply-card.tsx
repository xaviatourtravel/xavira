"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
};

const CONFIDENCE_TONES = {
  high: "success",
  medium: "warning",
  low: "neutral",
} as const;

export function AiSuggestedReplyCard({ conversation }: AiSuggestedReplyCardProps) {
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{ti("suggestedReply")}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{ti("suggestedReplySubtitle")}</p>
        </div>
        <InspectorBadge tone={CONFIDENCE_TONES[result.confidenceLevel]}>
          {result.confidence}% · {ti(result.confidenceLabelKey)}
        </InspectorBadge>
      </div>

      <textarea
        value={draftText}
        onChange={(event) => {
          isEditingRef.current = true;
          setDraftText(event.target.value);
        }}
        rows={5}
        className="w-full resize-y rounded-md border border-border/70 bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex flex-wrap gap-2">
        <InspectorAction variant="primary" onClick={handleInsert} disabled={!draftText.trim()}>
          {ti("insertToComposer")}
        </InspectorAction>
        <InspectorAction onClick={() => void handleCopy()} disabled={!draftText.trim()}>
          <Copy className="h-3.5 w-3.5" />
          {ti("copy")}
        </InspectorAction>
        <InspectorAction onClick={handleRegenerate}>{ti("regenerate")}</InspectorAction>
        <InspectorAction onClick={() => handleVariant("short")}>{ti("shorter")}</InspectorAction>
        <InspectorAction onClick={() => handleVariant("persuasive")}>
          {ti("morePersuasive")}
        </InspectorAction>
        <InspectorAction onClick={() => handleVariant("friendly")}>{ti("moreFriendly")}</InspectorAction>
        <InspectorAction onClick={() => handleVariant("professional")}>
          {ti("moreProfessional")}
        </InspectorAction>
        <InspectorAction disabled title={ti("comingSoon")}>
          {ti("translate")}
        </InspectorAction>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">{ti("generatedFrom")}</p>
        <div className="flex flex-wrap gap-2">
          {result.sources.map((source) => (
            <Link
              key={source.key}
              href={source.href}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted/50",
                source.active
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground",
              )}
            >
              {source.active ? <Check className="h-3 w-3" /> : null}
              {ti(source.labelKey)}
            </Link>
          ))}
        </div>
      </div>

      {result.confidence < 70 && result.missingContext.length > 0 ? (
        <div className="rounded-md bg-amber-500/10 px-3 py-2 text-[13px] text-amber-950 dark:text-amber-100">
          <p className="font-medium">{ti("incompleteReplyWarning")}</p>
          <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
            {ti("missingLabel")}
          </p>
          <ul className="mt-1 space-y-0.5">
            {result.missingContext.map((item) => (
              <li key={item}>{ti(result.missingContextLabelKeys[item])}</li>
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

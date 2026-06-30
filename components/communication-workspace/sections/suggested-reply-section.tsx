"use client";

import { memo, useState } from "react";
import { Check, Copy } from "lucide-react";

import {
  IntelligenceEmpty,
  IntelligencePreviewBadge,
  IntelligenceSection,
  IntelligenceSurface,
} from "@/components/communication-workspace/primitives";
import { buttonVariants } from "@/components/ui/button";
import type { WorkspaceIntelligencePlaceholder } from "@/lib/communication-workspace/types";
import { cn } from "@/lib/utils";

type SuggestedReplySectionProps = {
  intelligence: WorkspaceIntelligencePlaceholder;
  canUseReply: boolean;
};

export const SuggestedReplySection = memo(function SuggestedReplySection({
  intelligence,
  canUseReply,
}: SuggestedReplySectionProps) {
  const [copied, setCopied] = useState(false);
  const isPending = intelligence.state === "pending";

  async function handleCopy() {
    if (!intelligence.suggestedReply) {
      return;
    }

    await navigator.clipboard.writeText(intelligence.suggestedReply);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <IntelligenceSection
      title="Suggested Reply"
      badge={!isPending ? <IntelligencePreviewBadge /> : null}
    >
      {isPending ? (
        <IntelligenceEmpty>
          {canUseReply
            ? "A ready-to-send reply draft will appear here once the conversation has context."
            : "Reply suggestions will appear here when this channel supports outbound messaging."}
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="overflow-hidden">
          <div className="border-b border-soft bg-muted/40 px-4 py-2.5">
            <p className="text-[11px] text-muted-foreground">
              Draft · ready to review
            </p>
          </div>
          <div className="p-4">
            <p className="whitespace-pre-wrap text-xs leading-[1.7] text-foreground/90">
              {intelligence.suggestedReply}
            </p>
          </div>
          <div className="border-t border-soft px-3 py-2">
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy reply
                </>
              )}
            </button>
          </div>
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});

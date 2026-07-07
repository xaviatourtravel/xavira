"use client";

import Link from "next/link";
import { useMemo } from "react";

import { InspectorSection } from "@/components/ui/inspector";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { buildAiThinking } from "@/modules/inbox/lib/ai-thinking-engine";
import { buildCopilotMissingKnowledge } from "@/modules/inbox/lib/build-ai-copilot";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type MissingKnowledgeSectionProps = {
  conversation: OmnichannelConversationDetail;
};

export function MissingKnowledgeSection({
  conversation,
  hideDivider = false,
  hideTitle = false,
}: MissingKnowledgeSectionProps & { hideDivider?: boolean; hideTitle?: boolean }) {
  const { ti, locale } = useInboxTranslation();

  const items = useMemo(() => {
    const thinking = buildAiThinking({ conversation, locale });
    const qualificationMissing = buildCopilotMissingKnowledge(conversation);

    const merged = new Map<string, { labelKey: InboxKey; href: string }>();

    for (const item of thinking.missingContext) {
      merged.set(item.labelKey, { labelKey: item.labelKey, href: item.href });
    }

    for (const item of qualificationMissing) {
      merged.set(item.labelKey, {
        labelKey: item.labelKey,
        href: "/business-brain/knowledge",
      });
    }

    return [...merged.values()];
  }, [conversation, locale]);

  if (hideTitle) {
    return (
      <>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.labelKey}
                className="flex items-center justify-between gap-3 py-1"
              >
                <span className="text-sm text-foreground">{ti(item.labelKey)}</span>
                <Link
                  href={item.href}
                  className="shrink-0 text-xs text-primary transition-colors duration-150 hover:underline"
                >
                  {ti("createKnowledge")}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{ti("nothingMissingDesc")}</p>
        )}
      </>
    );
  }

  return (
    <InspectorSection title={ti("missingKnowledge")} hideDivider={hideDivider}>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.labelKey}
              className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <span className="text-[13px] text-foreground">{ti(item.labelKey)}</span>
              <Link
                href={item.href}
                className="shrink-0 text-xs text-primary hover:underline"
              >
                {ti("createKnowledge")}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{ti("nothingMissingDesc")}</p>
      )}
    </InspectorSection>
  );
}

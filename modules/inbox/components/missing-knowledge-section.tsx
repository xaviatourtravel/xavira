"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

import {
  InspectorEmpty,
  InspectorNotice,
  InspectorSection,
} from "@/components/ui/inspector";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { buildAiThinking } from "@/modules/inbox/lib/ai-thinking-engine";
import { buildCopilotMissingKnowledge } from "@/modules/inbox/lib/build-ai-copilot";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type MissingKnowledgeSectionProps = {
  conversation: OmnichannelConversationDetail;
};

export function MissingKnowledgeSection({ conversation }: MissingKnowledgeSectionProps) {
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

  return (
    <InspectorSection icon={AlertTriangle} title={ti("missingKnowledge")} collapsible>
      {items.length > 0 ? (
        <InspectorNotice tone="warning">
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.labelKey}
                className="flex items-center justify-between gap-2 text-[13px]"
              >
                <span>{ti(item.labelKey)}</span>
                <Link
                  href={item.href}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  {ti("createKnowledge")}
                </Link>
              </li>
            ))}
          </ul>
        </InspectorNotice>
      ) : (
        <InspectorEmpty title={ti("nothingMissing")} description={ti("nothingMissing")} />
      )}
    </InspectorSection>
  );
}

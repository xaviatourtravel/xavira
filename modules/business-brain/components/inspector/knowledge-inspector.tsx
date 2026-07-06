"use client";

import { BookOpen } from "lucide-react";

import { formatTranslation } from "@/lib/i18n/dictionary";
import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorConversationBubble,
  InspectorEmptyState,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbArticleCategoryLabel,
  bbDisplayArticleTitle,
} from "@/modules/business-brain/lib/bb-ui-labels";
import type { BrainArticleDetail } from "@/modules/business-brain/types/knowledge";

type KnowledgeInspectorProps = {
  article: BrainArticleDetail | null;
  productOptions: { id: string; name: string }[];
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function generateExampleReply(article: BrainArticleDetail): string {
  const snippet = stripHtml(article.content);
  const title = article.title || "this topic";
  if (!snippet) {
    return `I can help you with questions about ${title}. Let me know what you'd like to know.`;
  }
  const firstSentence = snippet.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length > 20) {
    return `${firstSentence}.`;
  }
  return `Based on our knowledge about ${title}: ${snippet.slice(0, 160)}${snippet.length > 160 ? "…" : ""}`;
}

export function KnowledgeInspector({ article, productOptions }: KnowledgeInspectorProps) {
  const { bb } = useBbTranslation();

  if (!article) {
    return (
      <BusinessBrainInspector
        title={bb("aiKnowledgeUsage")}
        subtitle={bb("aiKnowledgeUsageSubtitle")}
        icon={BookOpen}
      >
        <InspectorEmptyState message={bb("selectArticleInspector")} />
      </BusinessBrainInspector>
    );
  }

  const summary = stripHtml(article.content);
  const summaryText = summary.length > 220 ? `${summary.slice(0, 220)}…` : summary;
  const relatedProducts = productOptions.filter((p) =>
    article.relatedProductIds.includes(p.id),
  );
  const confidence = article.aiMetadata.confidenceWeight;
  const exampleReply = generateExampleReply(article);

  return (
    <BusinessBrainInspector
      title={bb("aiKnowledgeUsage")}
      subtitle={bb("aiKnowledgeUsageSubtitle")}
      icon={BookOpen}
      contentKey={`${article.id}-${article.updatedAt}`}
    >
      <InspectorSection title={bb("knowledgeSummary")}>
        <p className="text-sm font-medium text-foreground">
          {bbDisplayArticleTitle(bb, article.title)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {bbArticleCategoryLabel(bb, article.category)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {summaryText || bb("noContentYet")}
        </p>
      </InspectorSection>

      {article.keywords.length > 0 ? (
        <InspectorSection title={bb("matchingKeywords")}>
          <div className="flex flex-wrap gap-1.5">
            {article.keywords.map((keyword) => (
              <InspectorBadge key={keyword}>{keyword}</InspectorBadge>
            ))}
          </div>
        </InspectorSection>
      ) : null}

      <InspectorSection title={bb("relatedProducts")}>
        {relatedProducts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {relatedProducts.map((product) => (
              <InspectorBadge key={product.id} variant="default">
                {product.name}
              </InspectorBadge>
            ))}
          </div>
        ) : (
          <InspectorEmptyState message={bb("noLinkedProducts")} />
        )}
      </InspectorSection>

      <InspectorSection title={bb("confidence")}>
        <InspectorBadge variant={confidence != null && confidence >= 70 ? "success" : "muted"}>
          {confidence != null
            ? formatTranslation(bb("confidenceWeightFormatted"), { confidence })
            : bb("notConfigured")}
        </InspectorBadge>
      </InspectorSection>

      <InspectorSection title={bb("aiExampleReply")}>
        <InspectorConversationBubble role="ai">{exampleReply}</InspectorConversationBubble>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

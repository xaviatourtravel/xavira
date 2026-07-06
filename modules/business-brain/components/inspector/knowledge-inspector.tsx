"use client";

import { BookOpen } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorConversationBubble,
  InspectorEmptyState,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import {
  BRAIN_ARTICLE_CATEGORY_LABELS,
  type BrainArticleDetail,
} from "@/modules/business-brain/types/knowledge";

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
  if (!article) {
    return (
      <BusinessBrainInspector
        title="AI Knowledge Usage"
        subtitle="How AI retrieves and applies this knowledge."
        icon={BookOpen}
      >
        <InspectorEmptyState message="Select an article to preview AI knowledge usage." />
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
      title="AI Knowledge Usage"
      subtitle="How AI retrieves and applies this knowledge."
      icon={BookOpen}
      contentKey={`${article.id}-${article.updatedAt}`}
    >
      <InspectorSection title="Knowledge Summary">
        <p className="text-sm font-medium text-foreground">
          {article.title || "Untitled Article"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {BRAIN_ARTICLE_CATEGORY_LABELS[article.category]}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {summaryText || "No content yet."}
        </p>
      </InspectorSection>

      {article.keywords.length > 0 ? (
        <InspectorSection title="Matching Keywords">
          <div className="flex flex-wrap gap-1.5">
            {article.keywords.map((keyword) => (
              <InspectorBadge key={keyword}>{keyword}</InspectorBadge>
            ))}
          </div>
        </InspectorSection>
      ) : null}

      <InspectorSection title="Related Products">
        {relatedProducts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {relatedProducts.map((product) => (
              <InspectorBadge key={product.id} variant="default">
                {product.name}
              </InspectorBadge>
            ))}
          </div>
        ) : (
          <InspectorEmptyState message="No linked products." />
        )}
      </InspectorSection>

      <InspectorSection title="Confidence">
        <InspectorBadge variant={confidence != null && confidence >= 70 ? "success" : "muted"}>
          {confidence != null ? `${confidence}% weight` : "Not configured"}
        </InspectorBadge>
      </InspectorSection>

      <InspectorSection title="AI Example Reply">
        <InspectorConversationBubble role="ai">{exampleReply}</InspectorConversationBubble>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

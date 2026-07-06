"use client";

import { Package } from "lucide-react";

import type { BbUiKey } from "@/lib/i18n/bb-ui-dictionary";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorEmptyState,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbProductStatusLabel,
  bbScorePercent,
} from "@/modules/business-brain/lib/bb-ui-labels";
import type { BrainProductDetail } from "@/modules/business-brain/types/products";

type ProductInspectorProps = {
  product: BrainProductDetail | null;
  productOptions?: { id: string; name: string }[];
};

function buildMatchingKeywords(product: BrainProductDetail): string[] {
  const keywords = new Set<string>();
  if (product.category) keywords.add(product.category);
  if (product.destination) keywords.add(product.destination);
  product.highlights.forEach((item) => {
    item.split(/\s+/).slice(0, 3).forEach((word) => {
      if (word.length > 3) keywords.add(word.toLowerCase());
    });
  });
  return Array.from(keywords).slice(0, 8);
}

function recommendWhen(
  product: BrainProductDetail,
  bb: (key: BbUiKey) => string,
): string {
  if (product.aiNotes.trim()) return product.aiNotes.trim();
  const parts = [
    product.category ? `customers ask about ${product.category.toLowerCase()}` : null,
    product.destination ? `trips to ${product.destination}` : null,
  ].filter(Boolean);
  return parts.length > 0
    ? formatTranslation(bb("whenConditions"), { conditions: parts.join(" or ") })
    : bb("whenIntentMatches");
}

export function ProductInspector({ product }: ProductInspectorProps) {
  const { bb } = useBbTranslation();

  if (!product) {
    return (
      <BusinessBrainInspector
        title={bb("aiProductUsage")}
        subtitle={bb("aiProductUsageSubtitle")}
        icon={Package}
      >
        <InspectorEmptyState message={bb("selectProductInspector")} />
      </BusinessBrainInspector>
    );
  }

  const summary =
    product.description.length > 200
      ? `${product.description.slice(0, 200)}…`
      : product.description;
  const keywords = buildMatchingKeywords(product);
  const faqCount = product.faqLinks.length;
  const knowledgeScore = product.knowledgeScore;

  return (
    <BusinessBrainInspector
      title={bb("aiProductUsage")}
      subtitle={bb("aiProductUsageSubtitle")}
      icon={Package}
      contentKey={`${product.id}-${product.updatedAt}`}
    >
      <InspectorSection title={bb("summary")}>
        <p className="text-sm leading-relaxed text-foreground/90">
          {summary || bb("noDescriptionYet")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <InspectorBadge variant={product.status === "published" ? "success" : "warning"}>
            {bbProductStatusLabel(bb, product.status)}
          </InspectorBadge>
          {product.category ? <InspectorBadge>{product.category}</InspectorBadge> : null}
        </div>
      </InspectorSection>

      {product.highlights.length > 0 ? (
        <InspectorSection title={bb("highlights")}>
          <InspectorList
            items={product.highlights.slice(0, 5).map((item, index) => ({
              id: `${index}-${item}`,
              label: item,
            }))}
          />
        </InspectorSection>
      ) : null}

      {keywords.length > 0 ? (
        <InspectorSection title={bb("matchingKeywords")}>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <InspectorBadge key={keyword}>{keyword}</InspectorBadge>
            ))}
          </div>
        </InspectorSection>
      ) : null}

      <InspectorSection title={bb("whenAiWillRecommend")}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {recommendWhen(product, bb)}
        </p>
      </InspectorSection>

      <InspectorSection title={bb("knowledgeCoverageInspector")}>
        <div className="flex flex-wrap gap-2">
          <InspectorBadge variant={faqCount > 0 ? "success" : "muted"}>
            {formatTranslation(bb("linkedArticles"), { count: faqCount })}
          </InspectorBadge>
          <InspectorBadge variant={knowledgeScore >= 70 ? "success" : "warning"}>
            {bbScorePercent(bb, knowledgeScore)}
          </InspectorBadge>
        </div>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

"use client";

import { Package } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorEmptyState,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import {
  BRAIN_PRODUCT_STATUS_LABELS,
  type BrainProductDetail,
} from "@/modules/business-brain/types/products";

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

function recommendWhen(product: BrainProductDetail): string {
  if (product.aiNotes.trim()) return product.aiNotes.trim();
  const parts = [
    product.category ? `customers ask about ${product.category.toLowerCase()}` : null,
    product.destination ? `trips to ${product.destination}` : null,
  ].filter(Boolean);
  return parts.length > 0
    ? `When ${parts.join(" or ")}.`
    : "When customer intent matches product category or destination.";
}

export function ProductInspector({ product }: ProductInspectorProps) {
  if (!product) {
    return (
      <BusinessBrainInspector
        title="AI Product Usage"
        subtitle="How AI retrieves and recommends this product."
        icon={Package}
      >
        <InspectorEmptyState message="Select a product to see how AI will use it in conversations." />
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
      title="AI Product Usage"
      subtitle="How AI retrieves and recommends this product."
      icon={Package}
      contentKey={`${product.id}-${product.updatedAt}`}
    >
      <InspectorSection title="Summary">
        <p className="text-sm leading-relaxed text-foreground/90">
          {summary || "No description yet."}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <InspectorBadge variant={product.status === "published" ? "success" : "warning"}>
            {BRAIN_PRODUCT_STATUS_LABELS[product.status]}
          </InspectorBadge>
          {product.category ? <InspectorBadge>{product.category}</InspectorBadge> : null}
        </div>
      </InspectorSection>

      {product.highlights.length > 0 ? (
        <InspectorSection title="Highlights">
          <InspectorList
            items={product.highlights.slice(0, 5).map((item, index) => ({
              id: `${index}-${item}`,
              label: item,
            }))}
          />
        </InspectorSection>
      ) : null}

      {keywords.length > 0 ? (
        <InspectorSection title="Matching Keywords">
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <InspectorBadge key={keyword}>{keyword}</InspectorBadge>
            ))}
          </div>
        </InspectorSection>
      ) : null}

      <InspectorSection title="When AI Will Recommend">
        <p className="text-sm leading-relaxed text-muted-foreground">{recommendWhen(product)}</p>
      </InspectorSection>

      <InspectorSection title="Knowledge Coverage">
        <div className="flex flex-wrap gap-2">
          <InspectorBadge variant={faqCount > 0 ? "success" : "muted"}>
            {faqCount} linked article{faqCount === 1 ? "" : "s"}
          </InspectorBadge>
          <InspectorBadge variant={knowledgeScore >= 70 ? "success" : "warning"}>
            Score {knowledgeScore}%
          </InspectorBadge>
        </div>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}

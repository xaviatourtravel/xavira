import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type { PlaygroundAvailableContext } from "@/modules/business-brain/types/playground";

export function mapBusinessBrainContextToPlayground(
  context: BusinessBrainContext,
): PlaygroundAvailableContext {
  return {
    companyDna: {
      id: "company-dna",
      title: "Identity",
      items: context.companyDNA
        ? [
            {
              id: "company-name",
              label: context.companyDNA.companyName,
              detail: context.companyDNA.industry || undefined,
            },
            ...(context.companyDNA.brandPersonality.length > 0
              ? [
                  {
                    id: "personality",
                    label: "Brand personality",
                    detail: context.companyDNA.brandPersonality.slice(0, 3).join(", "),
                  },
                ]
              : []),
          ]
        : [],
      emptyLabel: "Nothing here yet. Complete Identity to give your AI business context.",
    },
    products: {
      id: "products",
      title: "Products",
      items: context.products.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.destination || item.category,
      })),
      emptyLabel: "Nothing here yet. Add products so your AI can recommend them.",
    },
    knowledge: {
      id: "knowledge",
      title: "Knowledge",
      items: context.knowledge.map((item) => ({
        id: item.id,
        label: item.title,
        detail: item.category,
      })),
      emptyLabel: "Nothing here yet. Add knowledge articles for your AI to reference.",
    },
    documents: {
      id: "documents",
      title: "Documents",
      items: context.documents.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.documentType,
      })),
      emptyLabel: "Nothing here yet. Upload documents your AI can send to customers.",
    },
    behaviors: {
      id: "behaviors",
      title: "Rules",
      items: context.behaviors.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.type === "ALWAYS_DO" ? "Always do" : "Never do",
      })),
      emptyLabel: "Nothing here yet. Add rules to guide how your AI responds.",
    },
    handoverRules: {
      id: "handover-rules",
      title: "Handover Rules",
      items: context.handoverRules.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.enabled
          ? `${item.triggerIntent} → ${item.assignToRole}`
          : "Disabled",
      })),
      emptyLabel: "Nothing here yet. Add handover rules for sensitive conversations.",
    },
  };
}

import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type { PlaygroundAvailableContext } from "@/modules/business-brain/types/playground";

export function mapBusinessBrainContextToPlayground(
  context: BusinessBrainContext,
): PlaygroundAvailableContext {
  return {
    companyDna: {
      id: "company-dna",
      title: "Company DNA Used",
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
      emptyLabel: "No Company DNA configured yet.",
    },
    products: {
      id: "products",
      title: "Products Used",
      items: context.products.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.destination || item.category,
      })),
      emptyLabel: "No published products available.",
    },
    knowledge: {
      id: "knowledge",
      title: "Knowledge Used",
      items: context.knowledge.map((item) => ({
        id: item.id,
        label: item.title,
        detail: item.category,
      })),
      emptyLabel: "No published knowledge articles available.",
    },
    documents: {
      id: "documents",
      title: "Documents Used",
      items: context.documents.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.documentType,
      })),
      emptyLabel: "No published documents available.",
    },
    behaviors: {
      id: "behaviors",
      title: "Behaviors Applied",
      items: context.behaviors.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.type === "ALWAYS_DO" ? "Always do" : "Never do",
      })),
      emptyLabel: "No enabled behavior rules yet.",
    },
    handoverRules: {
      id: "handover-rules",
      title: "Handover Rules Checked",
      items: context.handoverRules.map((item) => ({
        id: item.id,
        label: item.name,
        detail: item.enabled
          ? `${item.triggerIntent} → ${item.assignToRole}`
          : "Disabled",
      })),
      emptyLabel: "No handover rules configured.",
    },
  };
}

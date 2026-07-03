import { z } from "zod";

export const businessBrainMetricCardIdSchema = z.enum([
  "brain-health",
  "ai-readiness",
  "knowledge",
  "products",
  "documents",
  "publish-status",
]);

export * from "@/modules/business-brain/schemas/company-dna";
export * from "@/modules/business-brain/schemas/products";
export * from "@/modules/business-brain/schemas/knowledge";
export * from "@/modules/business-brain/schemas/documents";
export * from "@/modules/business-brain/schemas/behaviors";
export * from "@/modules/business-brain/schemas/playground";

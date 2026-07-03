import { z } from "zod";

import {
  BRAIN_ARTICLE_CATEGORIES,
  BRAIN_ARTICLE_STATUSES,
  BRAIN_ARTICLE_VISIBILITIES,
} from "@/modules/business-brain/types/knowledge";

const aiMetadataSchema = z.object({
  confidenceWeight: z.number().min(0).max(100).nullable().optional(),
  priority: z.number().int().min(0).max(10).nullable().optional(),
  relatedDocuments: z.array(z.string().trim()).optional(),
});

export const brainArticleFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  category: z.enum(BRAIN_ARTICLE_CATEGORIES),
  content: z.string(),
  keywords: z.array(z.string().trim().min(1)).max(30),
  visibility: z.enum(BRAIN_ARTICLE_VISIBILITIES),
  status: z.enum(BRAIN_ARTICLE_STATUSES),
  relatedProductIds: z.array(z.string().uuid()),
  aiMetadata: aiMetadataSchema.optional(),
});

export type BrainArticleFormInput = z.infer<typeof brainArticleFormSchema>;

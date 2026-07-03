import { z } from "zod";

import {
  BRAIN_DOCUMENT_STATUSES,
  BRAIN_DOCUMENT_TRIGGERS,
  BRAIN_DOCUMENT_TYPES,
} from "@/modules/business-brain/types/documents";

export const brainDocumentFormSchema = z.object({
  name: z.string().trim().min(1, "Document name is required."),
  description: z.string().trim(),
  documentType: z.enum(BRAIN_DOCUMENT_TYPES),
  tags: z.array(z.string().trim().min(1)).max(30),
  relatedProductIds: z.array(z.string().uuid()),
  relatedArticleIds: z.array(z.string().uuid()),
  autoSendEnabled: z.boolean(),
  triggers: z.array(z.enum(BRAIN_DOCUMENT_TRIGGERS)),
  aiNotes: z.string(),
  status: z.enum(BRAIN_DOCUMENT_STATUSES),
});

export type BrainDocumentFormInput = z.infer<typeof brainDocumentFormSchema>;

export const brainDocumentUrlSchema = z.object({
  name: z.string().trim().min(1, "Document name is required."),
  publicUrl: z.string().url("Enter a valid URL."),
  description: z.string().trim().optional(),
});

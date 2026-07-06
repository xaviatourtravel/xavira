import { z } from "zod";

export const saveBrainTestSessionSchema = z.object({
  title: z.string().trim().max(120).optional(),
  scenario: z.string().trim().max(80).nullable().optional(),
  conversation: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["customer", "ai"]),
      text: z.string(),
      aiScore: z.any().optional(),
    }),
  ),
  inspector: z.record(z.string(), z.unknown()),
  score: z.number().min(0).max(100),
});

export const renameBrainTestSessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required.").max(120),
});

export const deleteBrainTestSessionSchema = z.object({
  id: z.string().uuid(),
});

export type SaveBrainTestSessionInput = z.infer<typeof saveBrainTestSessionSchema>;

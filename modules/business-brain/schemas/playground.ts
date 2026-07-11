import { z } from "zod";

import { DEFAULT_PLAYGROUND_MEMORY_TEST } from "@/modules/ai/types/memory";
import { DEFAULT_PLAYGROUND_CONTEXT } from "@/modules/business-brain/types/playground";

const playgroundConversationTurnSchema = z.object({
  sender: z.enum(["customer", "human", "ai"]),
  text: z.string(),
  createdAt: z.string().optional(),
});

export const playgroundMemoryTestSchema = z.object({
  destination: z.string().trim(),
  departure_month: z.string().trim(),
  passenger_count: z.string().trim(),
  budget: z.string().trim(),
  trip_type: z.string().trim(),
  special_request: z.string().trim(),
});

export const playgroundCustomerContextSchema = z.object({
  customerName: z.string().trim(),
  destinationInterest: z.string().trim(),
  budget: z.string().trim(),
  departureMonth: z.string().trim(),
  passengerCount: z.string().trim(),
});

export const playgroundTestInputSchema = z.object({
  customerMessage: z.string().trim().min(1, "Customer message is required."),
  conversationHistory: z.array(playgroundConversationTurnSchema).default([]),
  sessionId: z.string().uuid().nullable().optional(),
  context: playgroundCustomerContextSchema.default(DEFAULT_PLAYGROUND_CONTEXT),
  memoryTest: playgroundMemoryTestSchema.default(DEFAULT_PLAYGROUND_MEMORY_TEST),
});

export const playgroundSaveExampleSchema = z.object({
  customerMessage: z.string().trim().min(1),
  aiReply: z.string().trim().min(1),
});

export type PlaygroundTestInputParsed = z.infer<typeof playgroundTestInputSchema>;
export type PlaygroundSaveExampleInput = z.infer<typeof playgroundSaveExampleSchema>;

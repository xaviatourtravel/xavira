import { z } from "zod";

import {
  BRAIN_BEHAVIOR_TYPES,
  BEHAVIOR_EMOJI_USAGE_OPTIONS,
  BEHAVIOR_REPLY_LENGTH_OPTIONS,
  CTA_STYLE_OPTIONS,
  HANDOVER_ASSIGN_ROLES,
  HANDOVER_TRIGGER_INTENTS,
  LANGUAGE_STYLE_OPTIONS,
} from "@/modules/business-brain/types/behaviors";

export const behaviorRuleSchema = z.object({
  name: z.string().trim().min(1, "Rule name is required."),
  description: z.string().trim(),
  enabled: z.boolean(),
});

export const handoverRuleSchema = behaviorRuleSchema.extend({
  config: z.object({
    triggerIntent: z.enum(HANDOVER_TRIGGER_INTENTS),
    assignToRole: z.enum(HANDOVER_ASSIGN_ROLES),
    handoffMessage: z.string().trim().min(1, "Handoff message is required."),
  }),
});

export const replyStyleSchema = z.object({
  config: z.object({
    useKak: z.boolean(),
    avoidRepeatedGreeting: z.boolean(),
    maxReplyLength: z.enum(BEHAVIOR_REPLY_LENGTH_OPTIONS),
    emojiUsage: z.enum(BEHAVIOR_EMOJI_USAGE_OPTIONS),
    ctaStyle: z.enum(CTA_STYLE_OPTIONS),
    languageStyle: z.enum(LANGUAGE_STYLE_OPTIONS),
  }),
  enabled: z.boolean(),
});

export const qualificationRuleSchema = z.object({
  config: z.object({
    destination: z.boolean(),
    departureMonth: z.boolean(),
    passengerCount: z.boolean(),
    budget: z.boolean(),
    privateOrGroup: z.boolean(),
    specialNeeds: z.boolean(),
  }),
  enabled: z.boolean(),
});

export const createBehaviorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ALWAYS_DO"),
    name: z.string().trim().min(1),
    description: z.string().trim(),
    enabled: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("NEVER_DO"),
    name: z.string().trim().min(1),
    description: z.string().trim(),
    enabled: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("HANDOVER_RULE"),
    name: z.string().trim().min(1),
    description: z.string().trim().optional(),
    enabled: z.boolean().optional(),
    config: z.object({
      triggerIntent: z.enum(HANDOVER_TRIGGER_INTENTS),
      assignToRole: z.enum(HANDOVER_ASSIGN_ROLES),
      handoffMessage: z.string().trim().min(1),
    }),
  }),
]);

export type CreateBehaviorInput = z.infer<typeof createBehaviorSchema>;

export const updateBehaviorSchema = z.object({
  type: z.enum(BRAIN_BEHAVIOR_TYPES),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

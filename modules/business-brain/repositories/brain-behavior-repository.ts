import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type {
  BrainBehaviorType,
  HandoverRuleConfig,
  QualificationConfig,
  ReplyStyleConfig,
} from "@/modules/business-brain/types/behaviors";
import {
  DEFAULT_HANDOFF_MESSAGE,
  DEFAULT_QUALIFICATION_CONFIG,
  DEFAULT_REPLY_STYLE_CONFIG,
  HANDOVER_ASSIGN_ROLES,
  HANDOVER_TRIGGER_INTENTS,
} from "@/modules/business-brain/types/behaviors";

export type BrainBehaviorRow = {
  id: string;
  business_brain_id: string;
  type: string;
  name: string;
  description: string;
  config: Json;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

function coerceBehaviorType(value: string): BrainBehaviorType {
  const types: BrainBehaviorType[] = [
    "ALWAYS_DO",
    "NEVER_DO",
    "HANDOVER_RULE",
    "REPLY_STYLE",
    "QUALIFICATION_RULE",
  ];
  return types.includes(value as BrainBehaviorType)
    ? (value as BrainBehaviorType)
    : "ALWAYS_DO";
}

function parseReplyStyleConfig(value: Json): ReplyStyleConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_REPLY_STYLE_CONFIG;
  }
  const record = value as Record<string, unknown>;
  return {
    useKak: record.useKak !== false,
    avoidRepeatedGreeting: record.avoidRepeatedGreeting !== false,
    maxReplyLength:
      record.maxReplyLength === "short" || record.maxReplyLength === "detailed"
        ? record.maxReplyLength
        : "medium",
    emojiUsage:
      record.emojiUsage === "never" ||
      record.emojiUsage === "natural" ||
      record.emojiUsage === "frequent"
        ? record.emojiUsage
        : "minimal",
    ctaStyle:
      record.ctaStyle === "soft" || record.ctaStyle === "direct"
        ? record.ctaStyle
        : "consultative",
    languageStyle:
      record.languageStyle === "indonesian" || record.languageStyle === "english"
        ? record.languageStyle
        : "mixed",
  };
}

function parseQualificationConfig(value: Json): QualificationConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_QUALIFICATION_CONFIG;
  }
  const record = value as Record<string, unknown>;
  return {
    destination: record.destination !== false,
    departureMonth: record.departureMonth !== false,
    passengerCount: record.passengerCount !== false,
    budget: record.budget !== false,
    privateOrGroup: record.privateOrGroup === true,
    specialNeeds: record.specialNeeds === true,
  };
}

function parseHandoverConfig(value: Json): HandoverRuleConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      triggerIntent: "negotiation",
      assignToRole: "Sales",
      handoffMessage: DEFAULT_HANDOFF_MESSAGE,
    };
  }
  const record = value as Record<string, unknown>;
  const triggerIntent = HANDOVER_TRIGGER_INTENTS.includes(
    record.triggerIntent as (typeof HANDOVER_TRIGGER_INTENTS)[number],
  )
    ? (record.triggerIntent as HandoverRuleConfig["triggerIntent"])
    : "negotiation";

  const assignToRole = HANDOVER_ASSIGN_ROLES.includes(
    record.assignToRole as (typeof HANDOVER_ASSIGN_ROLES)[number],
  )
    ? (record.assignToRole as HandoverRuleConfig["assignToRole"])
    : "Sales";

  return {
    triggerIntent,
    assignToRole,
    handoffMessage:
      typeof record.handoffMessage === "string" && record.handoffMessage.trim()
        ? record.handoffMessage
        : DEFAULT_HANDOFF_MESSAGE,
  };
}

export function mapBrainBehaviorRow(row: BrainBehaviorRow) {
  const type = coerceBehaviorType(row.type);
  let config: ReplyStyleConfig | QualificationConfig | HandoverRuleConfig | Record<string, never> =
    {};

  if (type === "REPLY_STYLE") {
    config = parseReplyStyleConfig(row.config);
  } else if (type === "QUALIFICATION_RULE") {
    config = parseQualificationConfig(row.config);
  } else if (type === "HANDOVER_RULE") {
    config = parseHandoverConfig(row.config);
  }

  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    type,
    name: row.name,
    description: row.description,
    config,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBrainBehaviors(
  businessBrainId: string,
): Promise<BrainBehaviorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_behaviors")
    .select("*")
    .eq("business_brain_id", businessBrainId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listBrainBehaviorsByType(
  businessBrainId: string,
  type: BrainBehaviorType,
): Promise<BrainBehaviorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_behaviors")
    .select("*")
    .eq("business_brain_id", businessBrainId)
    .eq("type", type)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function findBrainBehaviorById(
  behaviorId: string,
): Promise<BrainBehaviorRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_behaviors")
    .select("*")
    .eq("id", behaviorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertBrainBehavior(input: {
  businessBrainId: string;
  type: BrainBehaviorType;
  name: string;
  description?: string;
  config?: Json;
  enabled?: boolean;
}): Promise<BrainBehaviorRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_behaviors")
    .insert({
      business_brain_id: input.businessBrainId,
      type: input.type,
      name: input.name,
      description: input.description ?? "",
      config: input.config ?? {},
      enabled: input.enabled ?? true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBrainBehavior(
  behaviorId: string,
  values: {
    name?: string;
    description?: string;
    config?: Json;
    enabled?: boolean;
  },
): Promise<BrainBehaviorRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_behaviors")
    .update(values)
    .eq("id", behaviorId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBrainBehavior(behaviorId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("brain_behaviors").delete().eq("id", behaviorId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function setBrainBehaviorEnabled(
  behaviorId: string,
  enabled: boolean,
): Promise<BrainBehaviorRow> {
  return updateBrainBehavior(behaviorId, { enabled });
}

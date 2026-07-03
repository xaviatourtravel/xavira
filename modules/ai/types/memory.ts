export const CONVERSATION_MEMORY_KEYS = [
  "destination",
  "departure_month",
  "departure_date",
  "passenger_count",
  "budget",
  "trip_type",
  "private_or_group",
  "hotel_preference",
  "flight_preference",
  "special_request",
  "customer_language",
] as const;

export type ConversationMemoryKey = (typeof CONVERSATION_MEMORY_KEYS)[number];

export function isConversationMemoryKey(value: string): value is ConversationMemoryKey {
  return (CONVERSATION_MEMORY_KEYS as readonly string[]).includes(value);
}

export type ConversationMemorySource = "customer_message" | "ai_reply" | "manual";

export type ConversationMemoryEntry = {
  id: string;
  workspaceId: string;
  conversationId: string;
  customerId: string | null;
  memoryKey: ConversationMemoryKey;
  memoryValue: string;
  confidence: number;
  source: ConversationMemorySource;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMemoryMap = Partial<
  Record<ConversationMemoryKey, ConversationMemoryEntry>
>;

export type ExtractedMemoryItem = {
  memoryKey: ConversationMemoryKey;
  memoryValue: string;
  confidence: number;
  source: ConversationMemorySource;
};

export const MEMORY_KEY_LABELS: Record<ConversationMemoryKey, string> = {
  destination: "Destination",
  departure_month: "Departure Month",
  departure_date: "Departure Date",
  passenger_count: "Passenger Count",
  budget: "Budget",
  trip_type: "Trip Type",
  private_or_group: "Private / Group",
  hotel_preference: "Hotel Preference",
  flight_preference: "Flight Preference",
  special_request: "Special Request",
  customer_language: "Customer Language",
};

/** Editable memory fields in playground test panel. */
export const PLAYGROUND_MEMORY_TEST_KEYS = [
  "destination",
  "departure_month",
  "passenger_count",
  "budget",
  "trip_type",
  "special_request",
] as const satisfies readonly ConversationMemoryKey[];

export type PlaygroundMemoryTestInput = Record<
  (typeof PLAYGROUND_MEMORY_TEST_KEYS)[number],
  string
>;

export const DEFAULT_PLAYGROUND_MEMORY_TEST: PlaygroundMemoryTestInput = {
  destination: "",
  departure_month: "",
  passenger_count: "",
  budget: "",
  trip_type: "",
  special_request: "",
};

/** Playground read-only display fields (subset). */
export const PLAYGROUND_MEMORY_KEYS = [
  "destination",
  "departure_month",
  "budget",
  "passenger_count",
] as const satisfies readonly ConversationMemoryKey[];

export type PlaygroundMemoryDisplay = Record<
  (typeof PLAYGROUND_MEMORY_KEYS)[number],
  string | null
>;

export function getMemoryValue(
  memory: ConversationMemoryMap,
  key: ConversationMemoryKey,
): string | null {
  const value = memory[key]?.memoryValue?.trim();
  return value || null;
}

export function toPlaygroundMemoryDisplay(
  memory: ConversationMemoryMap,
): PlaygroundMemoryDisplay {
  return {
    destination: getMemoryValue(memory, "destination"),
    departure_month: getMemoryValue(memory, "departure_month"),
    budget: getMemoryValue(memory, "budget"),
    passenger_count: getMemoryValue(memory, "passenger_count"),
  };
}

export function countMemoryEntries(memory: ConversationMemoryMap): number {
  return CONVERSATION_MEMORY_KEYS.filter((key) => Boolean(getMemoryValue(memory, key))).length;
}

export type QualificationMemoryField = {
  configKey: "destination" | "departureMonth" | "passengerCount" | "budget" | "privateOrGroup" | "specialNeeds";
  memoryKeys: ConversationMemoryKey[];
  label: string;
  askHint: string;
};

export const QUALIFICATION_MEMORY_FIELDS: QualificationMemoryField[] = [
  {
    configKey: "destination",
    memoryKeys: ["destination"],
    label: "Destination",
    askHint: "destination interest",
  },
  {
    configKey: "departureMonth",
    memoryKeys: ["departure_month", "departure_date"],
    label: "Departure",
    askHint: "departure month or date",
  },
  {
    configKey: "passengerCount",
    memoryKeys: ["passenger_count"],
    label: "Passengers",
    askHint: "number of passengers",
  },
  {
    configKey: "budget",
    memoryKeys: ["budget"],
    label: "Budget",
    askHint: "budget range",
  },
  {
    configKey: "privateOrGroup",
    memoryKeys: ["private_or_group"],
    label: "Private / Group",
    askHint: "private or group preference",
  },
  {
    configKey: "specialNeeds",
    memoryKeys: ["special_request"],
    label: "Special needs",
    askHint: "special needs or requests",
  },
];

export function getQualificationMemoryValue(
  memory: ConversationMemoryMap,
  field: QualificationMemoryField,
): string | null {
  for (const key of field.memoryKeys) {
    const value = getMemoryValue(memory, key);
    if (value) return value;
  }
  return null;
}

export type ConversationMemoryPromptItem = {
  memory_key: string;
  memory_value: string;
  confidence: number;
};

export function toConversationMemoryPromptItems(
  memory: ConversationMemoryMap,
): ConversationMemoryPromptItem[] {
  return CONVERSATION_MEMORY_KEYS.flatMap((key) => {
    const entry = memory[key];
    if (!entry?.memoryValue?.trim()) return [];
    return [
      {
        memory_key: key,
        memory_value: entry.memoryValue.trim(),
        confidence: entry.confidence,
      },
    ];
  });
}

export function playgroundMemoryTestToPromptItems(
  input: PlaygroundMemoryTestInput,
  confidence = 0.95,
): ConversationMemoryPromptItem[] {
  return PLAYGROUND_MEMORY_TEST_KEYS.flatMap((key) => {
    const value = input[key]?.trim();
    if (!value) return [];
    return [{ memory_key: key, memory_value: value, confidence }];
  });
}

export function mergePromptMemoryItems(
  ...groups: ConversationMemoryPromptItem[][]
): ConversationMemoryPromptItem[] {
  const merged = new Map<string, ConversationMemoryPromptItem>();

  for (const group of groups) {
    for (const item of group) {
      const key = item.memory_key.trim();
      const value = item.memory_value.trim();
      if (!key || !value) continue;

      const existing = merged.get(key);
      if (!existing || item.confidence >= existing.confidence) {
        merged.set(key, {
          memory_key: key,
          memory_value: value,
          confidence: item.confidence,
        });
      }
    }
  }

  return Array.from(merged.values());
}

export function getPromptMemoryValue(
  memory: ConversationMemoryPromptItem[],
  key: ConversationMemoryKey,
): string | null {
  const item = memory.find((entry) => entry.memory_key === key);
  const value = item?.memory_value?.trim();
  return value || null;
}

export function getQualificationMemoryValueFromPrompt(
  memory: ConversationMemoryPromptItem[],
  field: QualificationMemoryField,
): string | null {
  for (const key of field.memoryKeys) {
    const value = getPromptMemoryValue(memory, key);
    if (value) return value;
  }
  return null;
}

export function promptItemsToPlaygroundMemoryDisplay(
  memory: ConversationMemoryPromptItem[],
): PlaygroundMemoryDisplay {
  return {
    destination: getPromptMemoryValue(memory, "destination"),
    departure_month: getPromptMemoryValue(memory, "departure_month"),
    budget: getPromptMemoryValue(memory, "budget"),
    passenger_count: getPromptMemoryValue(memory, "passenger_count"),
  };
}

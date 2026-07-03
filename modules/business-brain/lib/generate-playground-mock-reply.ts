import type { CompanyDnaRecord } from "@/modules/business-brain/types/company-dna";
import { DEFAULT_HANDOFF_MESSAGE } from "@/modules/business-brain/types/behaviors";
import type {
  PlaygroundCustomerContext,
  PlaygroundPreviewResult,
} from "@/modules/business-brain/types/playground";
import type { BrainBehaviorRecord } from "@/modules/business-brain/types/behaviors";
import type { BrainProductListItem } from "@/modules/business-brain/types/products";
import { HANDOVER_TRIGGER_LABELS } from "@/modules/business-brain/types/behaviors";

const HANDOFF_PATTERNS: Array<{
  intent: keyof typeof HANDOVER_TRIGGER_LABELS;
  patterns: RegExp;
}> = [
  { intent: "negotiation", patterns: /nego|negotiat|harga|diskon|murah|potong/i },
  { intent: "payment_proof", patterns: /bukti\s*bayar|payment\s*proof|transfer|receipt/i },
  { intent: "complaint", patterns: /komplain|complaint|kecewa|marah|buruk/i },
  { intent: "refund", patterns: /refund|pengembalian|balikin\s*uang/i },
  { intent: "phone_call_request", patterns: /telepon|phone\s*call|call\s*me|hubungi\s*saya/i },
  {
    intent: "custom_private_trip",
    patterns: /private\s*trip|trip\s*private|custom\s*trip|paket\s*private/i,
  },
];

function addressName(context: PlaygroundCustomerContext): string {
  const name = context.customerName.trim();
  return name ? `Kak ${name}` : "Kak";
}

function pickProduct(
  products: BrainProductListItem[],
  context: PlaygroundCustomerContext,
  message: string,
): BrainProductListItem | null {
  const published = products.filter((item) => item.status === "published");
  if (published.length === 0) return null;

  const needle = `${context.destinationInterest} ${message}`.toLowerCase();
  const matched = published.find(
    (item) =>
      item.destination.toLowerCase().includes(needle.trim()) ||
      item.name.toLowerCase().split(" ").some((word) => needle.includes(word) && word.length > 3),
  );
  return matched ?? published[0];
}

function detectHandoff(
  message: string,
  handoverRules: BrainBehaviorRecord[],
): { required: boolean; reason: string | null; handoffMessage: string } {
  const enabledRules = handoverRules.filter((rule) => rule.enabled);
  const normalized = message.toLowerCase();

  for (const pattern of HANDOFF_PATTERNS) {
    if (!pattern.patterns.test(normalized)) continue;

    const matchedRule = enabledRules.find((rule) => {
      const config = rule.config as { triggerIntent?: string };
      return config.triggerIntent === pattern.intent;
    });

    if (matchedRule) {
      const config = matchedRule.config as { handoffMessage?: string; assignToRole?: string };
      return {
        required: true,
        reason: `${HANDOVER_TRIGGER_LABELS[pattern.intent]} → ${config.assignToRole ?? "Team"}`,
        handoffMessage: config.handoffMessage?.trim() || DEFAULT_HANDOFF_MESSAGE,
      };
    }
  }

  return { required: false, reason: null, handoffMessage: DEFAULT_HANDOFF_MESSAGE };
}

function buildQualificationPrompt(context: PlaygroundCustomerContext): string | null {
  const missing: string[] = [];
  if (!context.destinationInterest.trim()) missing.push("destinasi");
  if (!context.departureMonth.trim()) missing.push("bulan keberangkatan");
  if (!context.passengerCount.trim()) missing.push("jumlah penumpang");
  if (!context.budget.trim()) missing.push("budget");

  if (missing.length === 0) return null;
  return `Boleh info ${missing.slice(0, 2).join(" dan ")}-nya ya?`;
}

export function generatePlaygroundMockReply(input: {
  customerMessage: string;
  context: PlaygroundCustomerContext;
  companyDna: CompanyDnaRecord | null;
  products: BrainProductListItem[];
  handoverRules: BrainBehaviorRecord[];
}): PlaygroundPreviewResult {
  const { customerMessage, context, companyDna, products, handoverRules } = input;
  const greeting = addressName(context);
  const handoff = detectHandoff(customerMessage, handoverRules);

  if (handoff.required) {
    return {
      aiReply: handoff.handoffMessage,
      confidence: 92,
      handoffRequired: true,
      handoffReason: handoff.reason,
      suggestedActions: ["Assign conversation to the matching team role."],
      usedSources: [],
      sourceLabels: [],
      documentActions: [],
    };
  }

  const product = pickProduct(products, context, customerMessage);
  const companyLabel = companyDna?.companyName.trim() || "tim kami";
  const qualification = buildQualificationPrompt(context);

  const parts: string[] = [`Baik ${greeting}, terima kasih sudah menghubungi ${companyLabel}.`];

  if (product) {
    parts.push(
      `Untuk ${context.destinationInterest.trim() || product.destination}, kami punya paket ${product.name} yang bisa jadi referensi.`,
    );
  } else if (context.destinationInterest.trim()) {
    parts.push(`Untuk ${context.destinationInterest}, saya bisa bantu carikan opsi paket yang sesuai.`);
  }

  if (context.departureMonth.trim() && context.passengerCount.trim()) {
    parts.push(
      `Catat ya: rencana berangkat ${context.departureMonth} untuk ${context.passengerCount} orang.`,
    );
  }

  if (context.budget.trim()) {
    parts.push(`Dengan budget sekitar ${context.budget}, saya bisa rekomendasikan paket yang paling pas.`);
  }

  if (qualification) {
    parts.push(qualification);
  } else {
    parts.push("Kalau berkenan, saya bisa kirimkan detail paket dan brochure-nya.");
  }

  const useKak = companyDna?.communicationStyle.language !== "english";
  const reply = parts.join(" ").replace(/\s+/g, " ").trim();
  const confidenceBase = 68 + Math.min(customerMessage.length, 80) / 4;
  const confidence = Math.min(
    96,
    Math.round(confidenceBase + (product ? 8 : 0) + (qualification ? -6 : 4)),
  );

  return {
    aiReply: useKak ? reply : reply.replace(/Kak/g, "").replace(/\s+/g, " ").trim(),
    confidence,
    handoffRequired: false,
    handoffReason: null,
    suggestedActions: qualification
      ? ["Collect missing qualification details before recommending a package."]
      : ["Share a suitable package summary and offer brochure."],
    usedSources: product ? [`product:${product.id}`] : [],
    sourceLabels: product ? [`Product: ${product.name}`] : companyDna ? ["Company DNA"] : [],
    documentActions: [],
  };
}

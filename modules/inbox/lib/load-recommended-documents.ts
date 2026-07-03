import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { RecommendedDocumentItem } from "@/modules/inbox/lib/build-ai-command-center";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

type BrainDocumentRow = {
  id: string;
  name: string;
  document_type: string;
  public_url: string | null;
  tags: unknown;
  status: string;
};

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function scoreDocument(
  document: BrainDocumentRow,
  keywords: string[],
): number {
  if (keywords.length === 0) {
    return document.status === "published" ? 1 : 0;
  }

  const haystack = `${document.name} ${parseTags(document.tags).join(" ")}`.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) {
      score += 2;
    }
  }

  if (haystack.includes("profile") || haystack.includes("company")) {
    score += 1;
  }

  if (haystack.includes("itinerary") || haystack.includes("brochure")) {
    score += 1;
  }

  return score;
}

export async function loadRecommendedDocuments(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  input: {
    leadQualification?: LeadQualificationSnapshot | null;
    conversationMemory?: ConversationMemoryMap | null;
  },
): Promise<RecommendedDocumentItem[]> {
  const { data: brain, error: brainError } = await supabase
    .from("business_brains")
    .select("id")
    .eq("organization_id", workspaceId)
    .maybeSingle();

  if (brainError || !brain) {
    return [];
  }

  const { data, error } = await supabase
    .from("brain_documents")
    .select("id, name, document_type, public_url, tags, status")
    .eq("business_brain_id", brain.id)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  const destination =
    input.leadQualification?.fields.destination?.trim() ||
    input.conversationMemory?.destination?.memoryValue?.trim() ||
    "";

  const keywords = destination
    ? destination.split(/[\s,/|-]+/).filter((part) => part.length > 2)
    : [];

  const ranked = (data as BrainDocumentRow[])
    .map((document) => ({
      document,
      score: scoreDocument(document, keywords),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return ranked.map(({ document }) => ({
    id: document.id,
    name: document.name || "Untitled Document",
    documentType: document.document_type || "pdf",
    previewUrl: document.public_url,
  }));
}

import type { Database } from "@/types/database";

export type KnowledgeCategory = Database["public"]["Enums"]["knowledge_category"];

export type KnowledgeAiStatus = "pending" | "processing" | "completed" | "failed";

export type KnowledgeSourceType = "manual" | "upload";

export const KNOWLEDGE_CATEGORY_OPTIONS: ReadonlyArray<{
  value: KnowledgeCategory;
  label: string;
  description: string;
}> = [
  {
    value: "product_knowledge",
    label: "Product Knowledge",
    description: "Detail paket, destinasi, harga, dan keunggulan produk.",
  },
  {
    value: "sop",
    label: "SOP",
    description: "Standar operasional, alur kerja, dan prosedur tim.",
  },
  {
    value: "faq",
    label: "FAQ",
    description: "Pertanyaan umum pelanggan beserta jawabannya.",
  },
  {
    value: "marketing_assets",
    label: "Marketing Assets",
    description: "Materi promosi, brand voice, dan referensi kampanye.",
  },
];

export const DEFAULT_KNOWLEDGE_CATEGORY: KnowledgeCategory = "product_knowledge";

const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> =
  Object.fromEntries(
    KNOWLEDGE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<KnowledgeCategory, string>;

export function isKnowledgeCategory(value: string): value is KnowledgeCategory {
  return KNOWLEDGE_CATEGORY_OPTIONS.some((option) => option.value === value);
}

export function parseKnowledgeCategory(value: string): KnowledgeCategory {
  return isKnowledgeCategory(value) ? value : DEFAULT_KNOWLEDGE_CATEGORY;
}

export function formatKnowledgeCategoryLabel(value: string): string {
  return isKnowledgeCategory(value)
    ? KNOWLEDGE_CATEGORY_LABELS[value]
    : "Lainnya";
}

export function parseKnowledgeTags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of value.split(",")) {
    const tag = raw.trim();
    if (!tag) {
      continue;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    tags.push(tag);
  }

  return tags.slice(0, 20);
}

export function formatKnowledgeTagsInput(tags: string[]): string {
  return tags.join(", ");
}

export type KnowledgeFileKind = "pdf" | "docx" | "txt";

export const KNOWLEDGE_FILE_ACCEPT = ".pdf,.docx,.txt";

export const KNOWLEDGE_MAX_FILE_BYTES = 20 * 1024 * 1024;

const KNOWLEDGE_MIME_TO_KIND: Record<string, KnowledgeFileKind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
};

export function resolveKnowledgeFileKind(
  fileName: string,
  mimeType: string,
): KnowledgeFileKind | null {
  const byMime = KNOWLEDGE_MIME_TO_KIND[mimeType];
  if (byMime) {
    return byMime;
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (lower.endsWith(".docx")) {
    return "docx";
  }
  if (lower.endsWith(".txt")) {
    return "txt";
  }

  return null;
}

export function formatKnowledgeAiStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "AI siap";
    case "processing":
      return "Memproses";
    case "failed":
      return "Gagal diproses";
    default:
      return "Menunggu";
  }
}

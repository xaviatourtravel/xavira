import type { KnowledgeCategory } from "@/lib/knowledge/constants";
import { formatKnowledgeCategoryLabel } from "@/lib/knowledge/constants";

export type KnowledgeFaqItem = {
  question: string;
  answer: string;
};

export type KnowledgeProcessingResult = {
  summary: string;
  keyPoints: string[];
  faq: KnowledgeFaqItem[];
};

/** Hard cap on characters sent to the model to control token cost. */
export const KNOWLEDGE_AI_CONTENT_LIMIT = 12000;

export function truncateKnowledgeContent(content: string): string {
  if (content.length <= KNOWLEDGE_AI_CONTENT_LIMIT) {
    return content;
  }
  return `${content.slice(0, KNOWLEDGE_AI_CONTENT_LIMIT)}\n\n[Konten dipotong untuk pemrosesan AI]`;
}

export function buildKnowledgeProcessingPrompt(input: {
  title: string;
  category: KnowledgeCategory;
  content: string;
}): string {
  const categoryLabel = formatKnowledgeCategoryLabel(input.category);

  return [
    "Kamu adalah analis knowledge base untuk travel agency Desklabs (Umroh & Halal Tour).",
    "Tugasmu mengubah dokumen perusahaan menjadi konteks yang mudah dipakai ulang oleh AI.",
    "",
    "STRICT RULES:",
    "- Gunakan HANYA informasi dari dokumen. Jangan mengarang fakta, harga, atau kebijakan.",
    "- Tulis dalam Bahasa Indonesia yang ringkas dan profesional.",
    "- Jika dokumen terlalu pendek/kurang jelas, tetap buat output sebaik mungkin tanpa berhalusinasi.",
    "",
    `Judul dokumen: ${input.title}`,
    `Kategori: ${categoryLabel}`,
    "",
    "Dokumen:",
    '"""',
    truncateKnowledgeContent(input.content),
    '"""',
    "",
    "Hasilkan:",
    "1. summary: ringkasan 2-4 kalimat tentang isi dan kegunaan dokumen.",
    "2. keyPoints: 3-7 poin penting paling actionable (kalimat singkat).",
    "3. faq: 3-6 pertanyaan pelanggan/tim yang relevan beserta jawaban singkat berbasis dokumen.",
    "",
    "Balas HANYA dengan JSON valid (tanpa markdown, tanpa code fence) dengan bentuk persis:",
    '{ "summary": "...", "keyPoints": ["..."], "faq": [ { "question": "...", "answer": "..." } ] }',
  ].join("\n");
}

function toStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) {
        result.push(trimmed);
      }
    }
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

function toFaqArray(value: unknown, limit: number): KnowledgeFaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: KnowledgeFaqItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const question =
      typeof record.question === "string" ? record.question.trim() : "";
    const answer = typeof record.answer === "string" ? record.answer.trim() : "";
    if (!question && !answer) {
      continue;
    }
    result.push({ question: question || "Pertanyaan", answer });
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

export function parseKnowledgeProcessingResponse(
  raw: string,
): KnowledgeProcessingResult | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const summary =
    typeof record.summary === "string" ? record.summary.trim() : "";

  return {
    summary,
    keyPoints: toStringArray(record.keyPoints, 7),
    faq: toFaqArray(record.faq, 6),
  };
}

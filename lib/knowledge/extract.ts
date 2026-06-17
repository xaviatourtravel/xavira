import type { KnowledgeFileKind } from "@/lib/knowledge/constants";

export type KnowledgeExtractionResult = {
  text: string;
  truncated: boolean;
};

/** Upper bound on extracted characters persisted to the database. */
const MAX_EXTRACTED_CHARS = 100000;

function normalizeText(value: string): KnowledgeExtractionResult {
  const cleaned = value
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length > MAX_EXTRACTED_CHARS) {
    return { text: cleaned.slice(0, MAX_EXTRACTED_CHARS), truncated: true };
  }

  return { text: cleaned, truncated: false };
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n\n") : text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

/**
 * Extracts plain text from an uploaded knowledge document. Supported kinds are
 * PDF, DOCX, and TXT. Throws a user-friendly error if extraction yields nothing.
 */
export async function extractKnowledgeText(
  buffer: Buffer,
  kind: KnowledgeFileKind,
): Promise<KnowledgeExtractionResult> {
  let raw = "";

  switch (kind) {
    case "pdf":
      raw = await extractPdf(buffer);
      break;
    case "docx":
      raw = await extractDocx(buffer);
      break;
    case "txt":
      raw = buffer.toString("utf8");
      break;
    default:
      throw new Error("Tipe file tidak didukung.");
  }

  const result = normalizeText(raw);

  if (!result.text) {
    throw new Error(
      "Tidak ada teks yang bisa diekstrak dari dokumen ini. Coba file lain atau isi konten manual.",
    );
  }

  return result;
}

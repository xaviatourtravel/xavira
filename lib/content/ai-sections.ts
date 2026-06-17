import {
  formatContentStudioList,
  type ContentStudioResult,
} from "@/lib/ai/content-studio";
import { parseStoredContentStudioOutput } from "@/lib/content/generations";

export type AiContentSections = {
  hook: string;
  voScript: string;
  caption: string;
  cta: string;
  thumbnailConcept: string;
  imagePrompt: string;
};

export const AI_CONTENT_SECTION_LABELS: ReadonlyArray<{
  key: keyof AiContentSections;
  label: string;
}> = [
  { key: "hook", label: "Hook" },
  { key: "voScript", label: "VO Script" },
  { key: "caption", label: "Caption" },
  { key: "cta", label: "CTA" },
  { key: "thumbnailConcept", label: "Thumbnail Concept" },
  { key: "imagePrompt", label: "Image Prompt" },
];

export function resolveAiContentSections(
  generatedOutput: unknown,
): AiContentSections | null {
  const result = parseStoredContentStudioOutput(generatedOutput);

  if (!result) {
    return null;
  }

  return mapContentStudioResultToSections(result);
}

export function mapContentStudioResultToSections(
  result: ContentStudioResult,
): AiContentSections {
  return {
    hook: formatContentStudioList(result.hooks),
    voScript: result.voScript,
    caption: result.caption,
    cta: result.cta,
    thumbnailConcept: result.thumbnailConcept,
    imagePrompt: result.imagePrompt,
  };
}

export function parseHooksFromTextarea(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function serializeContentStudioOutput(
  existing: ContentStudioResult,
  updates: {
    hooks: string[];
    voScript: string;
    caption: string;
    cta: string;
    thumbnailConcept: string;
    imagePrompt: string;
  },
): ContentStudioResult {
  return {
    contentIdeas: existing.contentIdeas,
    hooks: updates.hooks,
    voScript: updates.voScript.trim(),
    caption: updates.caption.trim(),
    cta: updates.cta.trim(),
    thumbnailConcept: updates.thumbnailConcept.trim(),
    imagePrompt: updates.imagePrompt.trim(),
  };
}

export function mapSectionsToFormDefaults(sections: AiContentSections) {
  return {
    hooks: sections.hook
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean)
      .join("\n"),
    voScript: sections.voScript,
    caption: sections.caption,
    cta: sections.cta,
    thumbnailConcept: sections.thumbnailConcept,
    imagePrompt: sections.imagePrompt,
  };
}

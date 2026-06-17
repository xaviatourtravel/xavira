import {
  getContentStudioAngleLabel,
  getContentStudioPillarLabel,
  isContentStudioAngle,
  isContentStudioPillar,
} from "@/lib/ai/content-studio";

export const THUMBNAIL_STYLE_PRESETS = [
  "educational",
  "premium_travel",
  "hard_sell",
  "storytelling",
] as const;

export type ThumbnailStylePreset = (typeof THUMBNAIL_STYLE_PRESETS)[number];

export const THUMBNAIL_COVER_FORMATS = [
  "instagram_reels",
  "tiktok",
] as const;

export type ThumbnailCoverFormat = (typeof THUMBNAIL_COVER_FORMATS)[number];

export const THUMBNAIL_IMAGE_VARIATION_COUNT = 4;

export type ThumbnailConcept = {
  mainVisualDescription: string;
  subject: string;
  emotion: string;
  composition: string;
  supportingElements: string;
};

export type ThumbnailCopyResult = {
  headlines: string[];
  concept: ThumbnailConcept;
};

export type ThumbnailImageVariation = {
  id: string;
  storagePath: string;
  publicUrl: string;
  prompt: string;
  coverFormat: ThumbnailCoverFormat;
  stylePreset: ThumbnailStylePreset;
};

export type ThumbnailStudioInputs = {
  sourceHook: string;
  sourceVoScript: string;
  contentPillar: string;
  contentAngle: string;
  customHeadline?: string;
  coverFormat: ThumbnailCoverFormat;
  stylePreset: ThumbnailStylePreset;
  aiContentGenerationId?: string;
};

const THUMBNAIL_STYLE_LABELS: Record<ThumbnailStylePreset, string> = {
  educational: "Educational",
  premium_travel: "Premium Travel",
  hard_sell: "Hard Sell",
  storytelling: "Storytelling",
};

const THUMBNAIL_COVER_FORMAT_LABELS: Record<ThumbnailCoverFormat, string> = {
  instagram_reels: "Instagram Reels Cover",
  tiktok: "TikTok Cover",
};

const THUMBNAIL_STYLE_GUIDANCE: Record<ThumbnailStylePreset, string> = {
  educational:
    "Clean layout, informative cues, subtle icons, trustworthy and helpful mood.",
  premium_travel:
    "Luxury travel aesthetic, cinematic lighting, aspirational destinations, polished composition.",
  hard_sell:
    "Bold typography area, urgency cues, high contrast, promo energy without clutter.",
  storytelling:
    "Human-centered scene, emotional narrative moment, warm tones, relatable subject.",
};

export function isThumbnailStylePreset(value: string): value is ThumbnailStylePreset {
  return THUMBNAIL_STYLE_PRESETS.includes(value as ThumbnailStylePreset);
}

export function isThumbnailCoverFormat(
  value: string,
): value is ThumbnailCoverFormat {
  return THUMBNAIL_COVER_FORMATS.includes(value as ThumbnailCoverFormat);
}

export function parseThumbnailStylePreset(value: string): ThumbnailStylePreset {
  return isThumbnailStylePreset(value) ? value : "premium_travel";
}

export function parseThumbnailCoverFormat(value: string): ThumbnailCoverFormat {
  return isThumbnailCoverFormat(value) ? value : "instagram_reels";
}

export function getThumbnailStylePresetLabel(value: string) {
  return isThumbnailStylePreset(value)
    ? THUMBNAIL_STYLE_LABELS[value]
    : value.replace(/_/g, " ");
}

export function getThumbnailCoverFormatLabel(value: string) {
  return isThumbnailCoverFormat(value)
    ? THUMBNAIL_COVER_FORMAT_LABELS[value]
    : value.replace(/_/g, " ");
}

export function getThumbnailImageSize(coverFormat: ThumbnailCoverFormat) {
  void coverFormat;
  return "1024x1792" as const;
}

function normalizeStringList(value: unknown, limit: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeConcept(value: unknown): ThumbnailConcept | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const mainVisualDescription =
    typeof record.mainVisualDescription === "string"
      ? record.mainVisualDescription.trim()
      : "";
  const subject =
    typeof record.subject === "string" ? record.subject.trim() : "";
  const emotion =
    typeof record.emotion === "string" ? record.emotion.trim() : "";
  const composition =
    typeof record.composition === "string" ? record.composition.trim() : "";
  const supportingElements =
    typeof record.supportingElements === "string"
      ? record.supportingElements.trim()
      : "";

  if (
    !mainVisualDescription ||
    !subject ||
    !emotion ||
    !composition ||
    !supportingElements
  ) {
    return null;
  }

  return {
    mainVisualDescription,
    subject,
    emotion,
    composition,
    supportingElements,
  };
}

export function parseThumbnailCopyResponse(raw: string): {
  success: true;
  data: ThumbnailCopyResult;
} | {
  success: false;
  message: string;
} {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      success: false,
      message: "Format respons AI tidak valid.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      success: false,
      message: "Format respons AI tidak valid.",
    };
  }

  const record = parsed as Record<string, unknown>;
  const headlines = normalizeStringList(record.headlines, 4);
  const concept = normalizeConcept(record.concept);

  if (headlines.length < 4 || !concept) {
    return {
      success: false,
      message: "Headline atau concept thumbnail belum lengkap.",
    };
  }

  for (const headline of headlines) {
    const wordCount = headline.split(/\s+/).filter(Boolean).length;
    if (wordCount > 8) {
      return {
        success: false,
        message: "Headline thumbnail terlalu panjang. Maksimal 8 kata.",
      };
    }
  }

  return {
    success: true,
    data: {
      headlines,
      concept,
    },
  };
}

export function buildThumbnailCopyPrompt(input: ThumbnailStudioInputs) {
  const pillarLabel = isContentStudioPillar(input.contentPillar)
    ? getContentStudioPillarLabel(input.contentPillar)
    : input.contentPillar;
  const angleLabel = isContentStudioAngle(input.contentAngle)
    ? getContentStudioAngleLabel(input.contentAngle)
    : input.contentAngle;
  const styleLabel = getThumbnailStylePresetLabel(input.stylePreset);
  const coverLabel = getThumbnailCoverFormatLabel(input.coverFormat);
  const customHeadline = input.customHeadline?.trim();

  return `Kamu adalah creative director thumbnail untuk travel brand Xavira (Umroh, Halal Tour, Muslim-friendly travel).

Buat thumbnail copy untuk Reels cover berdasarkan input berikut.

INPUT:
- Hook: ${input.sourceHook}
- VO Script: ${input.sourceVoScript}
- Content Pillar: ${pillarLabel}
- Content Angle: ${angleLabel}
- Style Preset: ${styleLabel}
- Cover Format: ${coverLabel}
${customHeadline ? `- Custom Headline (referensi opsional): ${customHeadline}` : ""}

ATURAN HEADLINE:
- Buat tepat 4 variasi headline
- Maksimal 6-8 kata per headline
- Pendek, high curiosity, cocok untuk Reels cover
- Bahasa Indonesia natural, bukan clickbait cheap
- Spesifik ke travel/muslim audience Xavira

ATURAN CONCEPT:
- Jelaskan konsep visual thumbnail yang kuat untuk ${coverLabel}
- Sesuaikan mood dengan style preset: ${THUMBNAIL_STYLE_GUIDANCE[input.stylePreset]}
- Jangan sertakan teks panjang di dalam gambar (headline akan ditambahkan terpisah)
- Hindari logo brand palsu atau watermark

OUTPUT JSON SAJA tanpa markdown:
{
  "headlines": ["headline 1", "headline 2", "headline 3", "headline 4"],
  "concept": {
    "mainVisualDescription": "deskripsi visual utama",
    "subject": "subjek utama",
    "emotion": "emosi yang ditampilkan",
    "composition": "komposisi frame vertical 9:16",
    "supportingElements": "elemen pendukung"
  }
}`;
}

export function buildThumbnailImagePrompt({
  headline,
  concept,
  stylePreset,
  coverFormat,
  variationIndex,
}: {
  headline: string;
  concept: ThumbnailConcept;
  stylePreset: ThumbnailStylePreset;
  coverFormat: ThumbnailCoverFormat;
  variationIndex: number;
}) {
  const styleLabel = getThumbnailStylePresetLabel(stylePreset);
  const coverLabel = getThumbnailCoverFormatLabel(coverFormat);

  return `Vertical social media cover thumbnail, ${coverLabel}, 9:16 aspect ratio.
Style: ${styleLabel}. ${THUMBNAIL_STYLE_GUIDANCE[stylePreset]}
Headline theme (do NOT render as readable text in image): "${headline}".
Main visual: ${concept.mainVisualDescription}.
Subject: ${concept.subject}.
Emotion: ${concept.emotion}.
Composition: ${concept.composition}.
Supporting elements: ${concept.supportingElements}.
Variation ${variationIndex + 1}: unique camera angle and layout while keeping brand-appropriate premium travel look.
Photorealistic, high quality, no watermark, no logo, no long text blocks, leave negative space for headline overlay.`;
}

export function formatThumbnailConcept(concept: ThumbnailConcept) {
  return [
    `Main Visual: ${concept.mainVisualDescription}`,
    `Subject: ${concept.subject}`,
    `Emotion: ${concept.emotion}`,
    `Composition: ${concept.composition}`,
    `Supporting Elements: ${concept.supportingElements}`,
  ].join("\n");
}

export function parseStoredThumbnailConcept(value: unknown): ThumbnailConcept | null {
  return normalizeConcept(value);
}

export function parseStoredThumbnailHeadlines(value: unknown) {
  return normalizeStringList(value, 4);
}

export function parseStoredThumbnailImages(value: unknown): ThumbnailImageVariation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const storagePath =
        typeof record.storagePath === "string" ? record.storagePath : "";
      const publicUrl =
        typeof record.publicUrl === "string" ? record.publicUrl : "";
      const prompt = typeof record.prompt === "string" ? record.prompt : "";
      const coverFormat = parseThumbnailCoverFormat(
        typeof record.coverFormat === "string" ? record.coverFormat : "",
      );
      const stylePreset = parseThumbnailStylePreset(
        typeof record.stylePreset === "string" ? record.stylePreset : "",
      );

      if (!id || !storagePath || !publicUrl || !prompt) {
        return null;
      }

      return {
        id,
        storagePath,
        publicUrl,
        prompt,
        coverFormat,
        stylePreset,
      } satisfies ThumbnailImageVariation;
    })
    .filter((item): item is ThumbnailImageVariation => item !== null);
}

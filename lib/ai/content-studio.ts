import { formatContentPlatformLabel } from "@/lib/content/constants";
import {
  formatPackageContentContextForPrompt,
  type PackageContentContext,
} from "@/lib/packages/content-context";
import { withRuntimeContext, type BuildRuntimeContextInput } from "@/modules/ai/runtime/build-runtime-context";

export const CONTENT_STUDIO_PILLARS = [
  "soft_sell",
  "hard_sell",
  "edukasi",
  "brand_awareness",
] as const;

export type ContentStudioPillar = (typeof CONTENT_STUDIO_PILLARS)[number];

export const CONTENT_STUDIO_ANGLES = [
  "pain_point",
  "fomo",
  "testimoni",
  "storytelling",
  "edukasi",
  "sejarah_islam",
  "luxury_experience",
  "family_travel",
] as const;

export type ContentStudioAngle = (typeof CONTENT_STUDIO_ANGLES)[number];

export const CONTENT_STUDIO_GOALS = [
  "lead_generation",
  "booking_conversion",
  "engagement",
  "brand_awareness",
  "retargeting",
] as const;

export type ContentStudioGoal = (typeof CONTENT_STUDIO_GOALS)[number];

const CONTENT_STUDIO_PILLAR_LABELS: Record<ContentStudioPillar, string> = {
  soft_sell: "Soft Sell",
  hard_sell: "Hard Sell",
  edukasi: "Edukasi",
  brand_awareness: "Brand Awareness",
};

const CONTENT_STUDIO_ANGLE_LABELS: Record<ContentStudioAngle, string> = {
  pain_point: "Pain Point",
  fomo: "FOMO",
  testimoni: "Testimoni",
  storytelling: "Storytelling",
  edukasi: "Edukasi",
  sejarah_islam: "Sejarah Islam",
  luxury_experience: "Luxury Experience",
  family_travel: "Family Travel",
};

const CONTENT_STUDIO_GOAL_LABELS: Record<ContentStudioGoal, string> = {
  lead_generation: "Lead Generation",
  booking_conversion: "Booking Conversion",
  engagement: "Engagement",
  brand_awareness: "Brand Awareness",
  retargeting: "Retargeting",
};

export type ContentStudioResult = {
  contentIdeas: string[];
  hooks: string[];
  voScript: string;
  caption: string;
  cta: string;
  thumbnailConcept: string;
  imagePrompt: string;
};

export const CONTENT_STUDIO_SOURCES = ["package_based", "free_topic"] as const;

export type ContentStudioSource = (typeof CONTENT_STUDIO_SOURCES)[number];

const CONTENT_STUDIO_SOURCE_LABELS: Record<ContentStudioSource, string> = {
  package_based: "Package Based",
  free_topic: "Free Topic",
};

export type ContentStudioGeneration = {
  id: string;
  source: ContentStudioSource;
  result: ContentStudioResult;
};

export type ContentStudioPromptInput = {
  source: ContentStudioSource;
  platform: string;
  goal: ContentStudioGoal;
  pillar: ContentStudioPillar;
  angle: ContentStudioAngle;
  additionalContext?: string;
  packageContext?: PackageContentContext;
  topic?: string;
  runtimeContext?: BuildRuntimeContextInput;
  /** @deprecated Use runtimeContext.timezone */
  timezone?: string | null;
};

export function isContentStudioSource(
  value: string,
): value is ContentStudioSource {
  return CONTENT_STUDIO_SOURCES.includes(value as ContentStudioSource);
}

export function parseContentStudioSource(value: string): ContentStudioSource {
  return isContentStudioSource(value) ? value : "package_based";
}

export function getContentStudioSourceLabel(source: ContentStudioSource) {
  return CONTENT_STUDIO_SOURCE_LABELS[source];
}

export function getContentStudioSourceBadgeClassName(
  source: ContentStudioSource,
) {
  return source === "package_based"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-violet-100 text-violet-800";
}

export function isContentStudioPillar(value: string): value is ContentStudioPillar {
  return CONTENT_STUDIO_PILLARS.includes(value as ContentStudioPillar);
}

export function isContentStudioAngle(value: string): value is ContentStudioAngle {
  return CONTENT_STUDIO_ANGLES.includes(value as ContentStudioAngle);
}

export function isContentStudioGoal(value: string): value is ContentStudioGoal {
  return CONTENT_STUDIO_GOALS.includes(value as ContentStudioGoal);
}

export function getContentStudioPillarLabel(pillar: ContentStudioPillar) {
  return CONTENT_STUDIO_PILLAR_LABELS[pillar];
}

export function getContentStudioAngleLabel(angle: ContentStudioAngle) {
  return CONTENT_STUDIO_ANGLE_LABELS[angle];
}

export function getContentStudioGoalLabel(goal: ContentStudioGoal) {
  return CONTENT_STUDIO_GOAL_LABELS[goal];
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

const XAVIRA_BRAND_VOICE_RULES = `
DESKLABS BRAND VOICE (wajib diikuti):
- Bahasa Indonesia conversational, premium, trustworthy.
- Terasa seperti senior travel copywriter — bukan chatbot, bukan template AI.
- Hangat tapi tidak lebay; meyakinkan tapi tidak hard selling norak.
- Cocok untuk Instagram Reels dan Carousel publishing.

Hindari (dilarang):
- "Apakah Anda ingin..."
- "Destinasi yang sangat menarik..."
- "Jangan lewatkan kesempatan emas..."
- "Paket wisata terbaik/sempurna..."
- Bahasa formal kaku atau marketing hype generik
- Menyebut judul paket mentah dari database (yang ada tanda |, kode 7D6N, dll)

Prefer:
- Curiosity hooks yang spesifik ke destinasi/rute paket
- Pain-based hooks dari target audience
- Storytelling ringkas (scene → tension → payoff)
- Islamic travel insights yang relevan (halal, keluarga, ibadah) tanpa preachy
- Sebut destinasi per kota — bukan string judul panjang
`.trim();

function getXaviraBrandVoiceForPackage(packageName: string) {
  return `${XAVIRA_BRAND_VOICE_RULES}
- Gunakan nama paket bersih saja: ${packageName}`;
}

const XAVIRA_BRAND_VOICE_FREE_TOPIC = `
DESKLABS BRAND VOICE (wajib diikuti):
- Bahasa Indonesia conversational, premium, trustworthy.
- Terasa seperti senior travel copywriter — bukan chatbot, bukan template AI.
- Hangat tapi tidak lebay; meyakinkan tapi tidak hard selling norak.
- Cocok untuk Instagram Reels dan Carousel publishing.

Hindari (dilarang):
- "Apakah Anda ingin..."
- "Destinasi yang sangat menarik..."
- "Jangan lewatkan kesempatan emas..."
- "Paket wisata terbaik/sempurna..."
- Bahasa formal kaku atau marketing hype generik
- Menyebut nama paket travel kecuali diminta eksplisit di topik/konteks

Prefer:
- Curiosity hooks yang relevan dengan topik
- Pain-based hooks dari target audience
- Storytelling ringkas (scene → tension → payoff)
- Islamic travel insights (halal, keluarga, ibadah) tanpa preachy
- Edukasi, awareness, dan industry insight yang actionable
`.trim();

function formatAdditionalContextSection(additionalContext?: string) {
  if (!additionalContext?.trim()) {
    return "";
  }

  return `

Konteks tambahan dari tim media:
${additionalContext.trim()}`;
}

const CONTENT_STUDIO_JSON_SCHEMA = `
Struktur JSON wajib:
{
  "contentIdeas": ["10 ide Reels/Carousel"],
  "hooks": ["10 hook conversational untuk 3 detik pertama Reels"],
  "voScript": "naskah VO Reels 30-45 detik, natural dan human",
  "caption": "caption IG siap publish dengan line break",
  "cta": "CTA singkat conversational",
  "thumbnailConcept": "konsep thumbnail/visual cover",
  "imagePrompt": "prompt visual AI spesifik topik & mood"
}`.trim();

function buildSharedContentRules(
  platformLabel: string,
  pillar: ContentStudioPillar,
  angle: ContentStudioAngle,
) {
  return `
Parameter konten:
- Platform: ${platformLabel}
- Content Pillar: ${getContentStudioPillarLabel(pillar)}
- Content Angle: ${getContentStudioAngleLabel(angle)}

Aturan format:
- Hooks: pendek, punchy, conversational — cocok dibuka Reels (max ~12 kata ideal).
- VO script: naskah bicara natural untuk Reels (ritme cepat, ada jeda, ada hook di 3 detik pertama).
- Caption: siap posting IG Carousel/Reels — paragraf pendek, emoji secukupnya (max 2-3), ada line break.
- CTA: soft tapi jelas (DM/chat/save — bukan hard pressure).
- Jangan sebut AI/ChatGPT/otomatis.
- Sesuaikan tone dengan pillar "${getContentStudioPillarLabel(pillar)}" dan angle "${getContentStudioAngleLabel(angle)}".
- Platform target: ${platformLabel}.`;
}

function buildPackageBasedContentStudioPrompt({
  packageContext,
  platform,
  goal,
  pillar,
  angle,
  additionalContext,
}: ContentStudioPromptInput & { packageContext: PackageContentContext }) {
  const platformLabel = formatContentPlatformLabel(platform);
  const { structured } = packageContext;
  const destinationPhrase =
    structured.destinations.length > 0
      ? structured.destinations.join(", ")
      : structured.packageName;

  const brandVoice = getXaviraBrandVoiceForPackage(structured.packageName);

  return `
Kamu adalah senior travel copywriter untuk brand Desklabs (Umroh & Halal Tour).
Tugasmu menulis konten sosial media yang SPESIFIK, human, dan siap publish — bukan draft generic.

Mode: Package Based

${formatPackageContentContextForPrompt(packageContext)}

${brandVoice}
${formatAdditionalContextSection(additionalContext)}

Parameter konten:
- Platform: ${platformLabel}
- Goal: ${getContentStudioGoalLabel(goal)}
- Content Pillar: ${getContentStudioPillarLabel(pillar)}
- Content Angle: ${getContentStudioAngleLabel(angle)}

Aturan konten:
- WAJIB spesifik ke paket "${structured.packageName}" dan destinasi: ${destinationPhrase}.
- DILARANG memakai judul database mentah (string dengan |, 7D6N, dll) di ide, hook, caption, atau VO.
- Gunakan durasi "${structured.duration ?? "sesuai paket"}" dan keberangkatan "${structured.departureMonth ?? "jadwal akan dikonfirmasi"}" hanya jika tersedia — jangan mengarang.
- Gunakan harga/kuota hanya jika ada di data operasional.
- Jangan mengarang hotel, maskapai, fasilitas, atau harga di luar data.
- Setiap ide/hook harus terasa unique untuk paket ini — bukan template yang bisa dipakai travel mana pun.
- Thumbnail & image prompt: visual spesifik ke destinasi paket, bukan stock travel generic.

Gaya penulisan:
- Tulis seperti copywriter senior yang paham audiens Muslim Indonesia.
- Integrasikan pain points → gain points → halal advantages secara natural.
${buildSharedContentRules(platformLabel, pillar, angle)}

Output JSON saja (tanpa markdown, tanpa penjelasan di luar JSON).

${CONTENT_STUDIO_JSON_SCHEMA.replace(
  "spesifik topik & mood",
  "spesifik destinasi & mood paket",
).replace(
  "konsep thumbnail/visual cover",
  "konsep thumbnail spesifik destinasi paket",
)}
`.trim();
}

function buildFreeTopicContentStudioPrompt({
  topic,
  platform,
  goal,
  pillar,
  angle,
  additionalContext,
}: ContentStudioPromptInput & { topic: string }) {
  const platformLabel = formatContentPlatformLabel(platform);

  return `
Kamu adalah senior travel copywriter untuk brand Desklabs (Umroh & Halal Tour).
Tugasmu menulis konten sosial media edukatif, insightful, dan siap publish — bukan draft generic.

Mode: Free Topic

Topik / Content Idea:
${topic.trim()}
${formatAdditionalContextSection(additionalContext)}

${XAVIRA_BRAND_VOICE_FREE_TOPIC}

Parameter konten:
- Platform: ${platformLabel}
- Goal: ${getContentStudioGoalLabel(goal)}
- Content Pillar: ${getContentStudioPillarLabel(pillar)}
- Content Angle: ${getContentStudioAngleLabel(angle)}

Aturan konten (Free Topic):
- Fokus pada topik di atas — edukasi, awareness, storytelling, atau industry insight.
- JANGAN memaksakan referensi paket travel atau nama paket kecuali topik/konteks tambahan memintanya.
- Jangan mengarang harga, jadwal keberangkatan, kuota seat, atau detail paket spesifik.
- Konten harus terasa relevan untuk audiens Muslim/travel halal Indonesia.
- Thumbnail & image prompt: visual yang mendukung topik, bukan generic stock travel.
${buildSharedContentRules(platformLabel, pillar, angle)}

Output JSON saja (tanpa markdown, tanpa penjelasan di luar JSON).

${CONTENT_STUDIO_JSON_SCHEMA}
`.trim();
}

export function buildContentStudioPrompt(input: ContentStudioPromptInput) {
  let prompt: string;

  if (input.source === "free_topic") {
    if (!input.topic?.trim()) {
      throw new Error("Topik konten wajib diisi untuk mode Free Topic.");
    }

    prompt = buildFreeTopicContentStudioPrompt({
      ...input,
      topic: input.topic.trim(),
    });
  } else {
    if (!input.packageContext) {
      throw new Error("Konteks paket wajib ada untuk mode Package Based.");
    }

    prompt = buildPackageBasedContentStudioPrompt({
      ...input,
      packageContext: input.packageContext,
    });
  }

  return withRuntimeContext(prompt, input.runtimeContext ?? { timezone: input.timezone });
}

export function parseContentStudioResponse(raw: string):
  | { success: true; data: ContentStudioResult }
  | { success: false; message: string } {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const contentIdeas = normalizeStringList(parsed.contentIdeas, 10);
    const hooks = normalizeStringList(parsed.hooks, 10);
    const voScript =
      typeof parsed.voScript === "string" ? parsed.voScript.trim() : "";
    const caption =
      typeof parsed.caption === "string" ? parsed.caption.trim() : "";
    const cta = typeof parsed.cta === "string" ? parsed.cta.trim() : "";
    const thumbnailConcept =
      typeof parsed.thumbnailConcept === "string"
        ? parsed.thumbnailConcept.trim()
        : "";
    const imagePrompt =
      typeof parsed.imagePrompt === "string" ? parsed.imagePrompt.trim() : "";

    if (
      contentIdeas.length === 0 ||
      hooks.length === 0 ||
      !voScript ||
      !caption ||
      !cta ||
      !thumbnailConcept ||
      !imagePrompt
    ) {
      return {
        success: false,
        message: "Respons AI tidak lengkap. Coba generate ulang.",
      };
    }

    return {
      success: true,
      data: {
        contentIdeas,
        hooks,
        voScript,
        caption,
        cta,
        thumbnailConcept,
        imagePrompt,
      },
    };
  } catch {
    return {
      success: false,
      message: "Gagal membaca hasil AI. Coba generate ulang.",
    };
  }
}

export function formatContentStudioList(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

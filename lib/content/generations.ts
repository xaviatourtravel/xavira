import {
  getContentStudioAngleLabel,
  getContentStudioGoalLabel,
  getContentStudioPillarLabel,
  getContentStudioSourceLabel,
  isContentStudioAngle,
  isContentStudioGoal,
  isContentStudioPillar,
  type ContentStudioResult,
  type ContentStudioSource,
} from "@/lib/ai/content-studio";
import { formatContentPlatformLabel } from "@/lib/content/constants";

export type AiContentGenerationRow = {
  id: string;
  organization_id: string;
  created_by: string | null;
  source_type: ContentStudioSource;
  package_id: string | null;
  topic: string | null;
  platform: string | null;
  goal: string | null;
  content_pillar: string | null;
  content_angle: string | null;
  additional_context: string | null;
  generated_output: unknown;
  created_at: string;
  packages?: { name: string } | { name: string }[] | null;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
};

export type ContentGenerationListItem = {
  id: string;
  sourceType: ContentStudioSource;
  sourceLabel: string;
  packageId: string | null;
  packageName: string | null;
  topic: string | null;
  subjectLabel: string;
  platform: string | null;
  platformLabel: string;
  goal: string | null;
  goalLabel: string | null;
  contentPillar: string | null;
  pillarLabel: string | null;
  contentAngle: string | null;
  angleLabel: string | null;
  additionalContext: string | null;
  preview: string;
  result: ContentStudioResult;
  createdAt: string;
  createdByName: string | null;
};

function getRelationName(
  relation:
    | { name?: string | null; full_name?: string | null }
    | { name?: string | null; full_name?: string | null }[]
    | null
    | undefined,
  field: "name" | "full_name",
) {
  const record = Array.isArray(relation) ? relation[0] : relation;
  if (!record) {
    return null;
  }

  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

export function parseStoredContentStudioOutput(
  value: unknown,
): ContentStudioResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const contentIdeas = normalizeStringList(record.contentIdeas, 10);
  const hooks = normalizeStringList(record.hooks, 10);
  const voScript =
    typeof record.voScript === "string" ? record.voScript.trim() : "";
  const caption =
    typeof record.caption === "string" ? record.caption.trim() : "";
  const cta = typeof record.cta === "string" ? record.cta.trim() : "";
  const thumbnailConcept =
    typeof record.thumbnailConcept === "string"
      ? record.thumbnailConcept.trim()
      : "";
  const imagePrompt =
    typeof record.imagePrompt === "string" ? record.imagePrompt.trim() : "";

  if (
    contentIdeas.length === 0 ||
    hooks.length === 0 ||
    !voScript ||
    !caption ||
    !cta ||
    !thumbnailConcept ||
    !imagePrompt
  ) {
    return null;
  }

  return {
    contentIdeas,
    hooks,
    voScript,
    caption,
    cta,
    thumbnailConcept,
    imagePrompt,
  };
}

export function buildGenerationPreview(result: ContentStudioResult) {
  const hook = result.hooks[0];
  const idea = result.contentIdeas[0];

  if (hook) {
    return hook.length > 120 ? `${hook.slice(0, 117)}...` : hook;
  }

  if (idea) {
    return idea.length > 120 ? `${idea.slice(0, 117)}...` : idea;
  }

  return result.caption.slice(0, 120);
}

export function buildContentBoardNotesFromGeneration(
  result: ContentStudioResult,
) {
  const idea = result.contentIdeas[0];
  const hook = result.hooks[0];
  const voExcerpt = result.voScript.slice(0, 280);

  return [
    idea ? `Ide utama: ${idea}` : null,
    hook ? `Hook: ${hook}` : null,
    voExcerpt
      ? `VO (ringkas): ${voExcerpt}${result.voScript.length > 280 ? "..." : ""}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildDefaultContentBoardTitle(
  subjectLabel: string,
  result: ContentStudioResult,
) {
  const idea = result.contentIdeas[0]?.trim();

  if (idea) {
    return idea.length > 80 ? `${idea.slice(0, 77)}...` : idea;
  }

  return subjectLabel.length > 80
    ? `${subjectLabel.slice(0, 77)}...`
    : subjectLabel;
}

export function mapContentGenerationRow(
  row: AiContentGenerationRow,
): ContentGenerationListItem | null {
  const result = parseStoredContentStudioOutput(row.generated_output);

  if (!result) {
    return null;
  }

  const packageName = getRelationName(row.packages, "name");
  const subjectLabel =
    row.source_type === "package_based"
      ? packageName ?? "Paket"
      : row.topic?.trim() || "Free Topic";

  return {
    id: row.id,
    sourceType: row.source_type,
    sourceLabel: getContentStudioSourceLabel(row.source_type),
    packageId: row.package_id,
    packageName,
    topic: row.topic,
    subjectLabel,
    platform: row.platform,
    platformLabel: row.platform
      ? formatContentPlatformLabel(row.platform)
      : "-",
    goal: row.goal,
    goalLabel:
      row.goal && isContentStudioGoal(row.goal)
        ? getContentStudioGoalLabel(row.goal)
        : row.goal,
    contentPillar: row.content_pillar,
    pillarLabel:
      row.content_pillar && isContentStudioPillar(row.content_pillar)
        ? getContentStudioPillarLabel(row.content_pillar)
        : row.content_pillar,
    contentAngle: row.content_angle,
    angleLabel:
      row.content_angle && isContentStudioAngle(row.content_angle)
        ? getContentStudioAngleLabel(row.content_angle)
        : row.content_angle,
    additionalContext: row.additional_context,
    preview: buildGenerationPreview(result),
    result,
    createdAt: row.created_at,
    createdByName: getRelationName(row.profiles, "full_name"),
  };
}

export function formatGenerationDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

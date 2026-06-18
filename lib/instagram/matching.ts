export type ContentMatchCandidate = {
  id: string;
  title: string;
  caption: string | null;
  instagram_media_id: string | null;
  instagram_permalink: string | null;
  publish_date: string | null;
  status: string;
};

export type InstagramMediaMatchInput = {
  instagramMediaId: string;
  permalink: string | null;
  caption: string | null;
  postedAt: string | null;
};

export type ContentMatchSuggestion = {
  content: ContentMatchCandidate;
  score: number;
  reasons: string[];
};

const MIN_SUGGESTION_SCORE = 25;
const AUTO_LINK_CAPTION_MIN_TITLE_LENGTH = 4;

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeInstagramPermalink(url: string) {
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    return `${parsed.hostname}${parsed.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/\/$/, "");
  }
}

function tokenize(value: string) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((word) => word.length >= 3),
  );
}

function daysBetween(
  publishDate: string | null,
  postedAt: string | null,
): number | null {
  if (!publishDate || !postedAt) {
    return null;
  }

  const publish = new Date(publishDate);
  const posted = new Date(postedAt);

  if (Number.isNaN(publish.getTime()) || Number.isNaN(posted.getTime())) {
    return null;
  }

  return Math.abs(
    Math.round((posted.getTime() - publish.getTime()) / 86_400_000),
  );
}

function scoreCaptionSimilarity(
  content: ContentMatchCandidate,
  media: InstagramMediaMatchInput,
): { score: number; reason: string | null } {
  const normalizedTitle = normalizeText(content.title);
  const mediaCaption = media.caption ? normalizeText(media.caption) : "";
  const contentCaption = content.caption ? normalizeText(content.caption) : "";

  if (
    normalizedTitle.length >= AUTO_LINK_CAPTION_MIN_TITLE_LENGTH &&
    mediaCaption.includes(normalizedTitle)
  ) {
    return { score: 40, reason: "Judul cocok dengan caption IG" };
  }

  const titleTokens = tokenize(content.title);
  const captionTokens = tokenize(
    [media.caption, content.caption].filter(Boolean).join(" "),
  );

  if (titleTokens.size === 0 || captionTokens.size === 0) {
    return { score: 0, reason: null };
  }

  let overlap = 0;
  for (const token of titleTokens) {
    if (captionTokens.has(token)) {
      overlap += 1;
    }
  }

  const ratio = overlap / titleTokens.size;
  if (ratio < 0.25) {
    return { score: 0, reason: null };
  }

  const score = Math.min(30, Math.round(ratio * 30));
  return {
    score,
    reason: score > 0 ? "Kata kunci caption mirip" : null,
  };
}

function scoreDateProximity(
  content: ContentMatchCandidate,
  media: InstagramMediaMatchInput,
): { score: number; reason: string | null } {
  const days = daysBetween(content.publish_date, media.postedAt);

  if (days === null) {
    return { score: 0, reason: null };
  }

  if (days === 0) {
    return { score: 30, reason: "Tanggal publish sama" };
  }

  if (days <= 3) {
    return { score: 20, reason: `Tanggal publish ±${days} hari` };
  }

  if (days <= 7) {
    return { score: 10, reason: `Tanggal publish ±${days} hari` };
  }

  return { score: 0, reason: null };
}

export function findDirectContentMatch<T extends ContentMatchCandidate>(
  contents: T[],
  media: InstagramMediaMatchInput,
): T | null {
  const byMediaId = contents.find(
    (content) => content.instagram_media_id === media.instagramMediaId,
  );

  if (byMediaId) {
    return byMediaId;
  }

  if (!media.permalink) {
    return null;
  }

  const normalizedPermalink = normalizeInstagramPermalink(media.permalink);

  return (
    contents.find((content) => {
      if (!content.instagram_permalink) {
        return false;
      }

      return (
        normalizeInstagramPermalink(content.instagram_permalink) ===
        normalizedPermalink
      );
    }) ?? null
  );
}

export function findAutoLinkContentMatch<T extends ContentMatchCandidate>(
  contents: T[],
  media: InstagramMediaMatchInput,
): T | null {
  const direct = findDirectContentMatch(contents, media);
  if (direct) {
    return direct;
  }

  if (!media.caption) {
    return null;
  }

  const normalizedCaption = normalizeText(media.caption);

  for (const content of contents) {
    const normalizedTitle = normalizeText(content.title);
    if (
      normalizedTitle.length >= AUTO_LINK_CAPTION_MIN_TITLE_LENGTH &&
      normalizedCaption.includes(normalizedTitle)
    ) {
      return content;
    }
  }

  return null;
}

export function suggestContentMatchesForMedia<T extends ContentMatchCandidate>(
  contents: T[],
  media: InstagramMediaMatchInput,
  limit = 5,
): Array<ContentMatchSuggestion & { content: T }> {
  const suggestions: Array<ContentMatchSuggestion & { content: T }> = [];

  for (const content of contents) {
    if (content.instagram_media_id && content.instagram_media_id !== media.instagramMediaId) {
      continue;
    }

    const reasons: string[] = [];
    let score = 0;

    const captionMatch = scoreCaptionSimilarity(content, media);
    score += captionMatch.score;
    if (captionMatch.reason) {
      reasons.push(captionMatch.reason);
    }

    const dateMatch = scoreDateProximity(content, media);
    score += dateMatch.score;
    if (dateMatch.reason) {
      reasons.push(dateMatch.reason);
    }

    if (score < MIN_SUGGESTION_SCORE) {
      continue;
    }

    suggestions.push({ content, score, reasons });
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function suggestInstagramMatchesForContent<T extends ContentMatchCandidate>(
  mediaItems: InstagramMediaMatchInput[],
  content: T,
  limit = 5,
): Array<ContentMatchSuggestion & { content: T; media: InstagramMediaMatchInput }> {
  const suggestions: Array<
    ContentMatchSuggestion & { content: T; media: InstagramMediaMatchInput }
  > = [];

  for (const media of mediaItems) {
    const reasons: string[] = [];
    let score = 0;

    const captionMatch = scoreCaptionSimilarity(content, media);
    score += captionMatch.score;
    if (captionMatch.reason) {
      reasons.push(captionMatch.reason);
    }

    const dateMatch = scoreDateProximity(content, media);
    score += dateMatch.score;
    if (dateMatch.reason) {
      reasons.push(dateMatch.reason);
    }

    if (score < MIN_SUGGESTION_SCORE) {
      continue;
    }

    suggestions.push({
      content,
      media,
      score,
      reasons,
    });
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

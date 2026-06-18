import {
  suggestContentMatchesForMedia,
  suggestInstagramMatchesForContent,
  type ContentMatchCandidate,
  type ContentMatchSuggestion,
  type InstagramMediaMatchInput,
} from "@/lib/instagram/matching";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ContentLinkRow = ContentMatchCandidate & {
  ai_generation_id: string | null;
  ai_content_generations:
    | { content_pillar: string | null }
    | { content_pillar: string | null }[]
    | null;
};

type MediaInsightLinkRow = {
  instagram_media_id: string;
  permalink: string | null;
  caption: string | null;
  posted_at: string | null;
  content_id: string | null;
};

function getContentPillar(row: ContentLinkRow): string | null {
  const generation = row.ai_content_generations;
  if (!generation) {
    return null;
  }

  const item = Array.isArray(generation) ? generation[0] : generation;
  return item?.content_pillar ?? null;
}

async function loadInstagramContentCandidates(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<ContentLinkRow[]> {
  const { data, error } = await supabase
    .from("contents")
    .select(
      `
      id,
      title,
      caption,
      status,
      publish_date,
      instagram_media_id,
      instagram_permalink,
      ai_generation_id,
      ai_content_generations ( content_pillar )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("platform", "instagram");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContentLinkRow[];
}

async function loadMediaInsightRows(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<MediaInsightLinkRow[]> {
  const { data, error } = await supabase
    .from("instagram_media_insights")
    .select("instagram_media_id, permalink, caption, posted_at, content_id")
    .eq("organization_id", organizationId)
    .order("posted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MediaInsightLinkRow[];
}

export async function loadSuggestedContentMatchesForMedia(
  supabase: SupabaseServerClient,
  organizationId: string,
  instagramMediaId: string,
): Promise<ContentMatchSuggestion[]> {
  const [contents, mediaRows] = await Promise.all([
    loadInstagramContentCandidates(supabase, organizationId),
    loadMediaInsightRows(supabase, organizationId),
  ]);

  const media = mediaRows.find((row) => row.instagram_media_id === instagramMediaId);
  if (!media) {
    return [];
  }

  const mediaInput: InstagramMediaMatchInput = {
    instagramMediaId: media.instagram_media_id,
    permalink: media.permalink,
    caption: media.caption,
    postedAt: media.posted_at,
  };

  const unlinkedContents = contents.filter(
    (content) =>
      !content.instagram_media_id ||
      content.instagram_media_id === instagramMediaId,
  );

  return suggestContentMatchesForMedia(unlinkedContents, mediaInput);
}

export async function loadSuggestedInstagramMatchesForContent(
  supabase: SupabaseServerClient,
  organizationId: string,
  contentId: string,
): Promise<
  Array<ContentMatchSuggestion & { media: InstagramMediaMatchInput }>
> {
  const [contents, mediaRows] = await Promise.all([
    loadInstagramContentCandidates(supabase, organizationId),
    loadMediaInsightRows(supabase, organizationId),
  ]);

  const content = contents.find((row) => row.id === contentId);
  if (!content) {
    return [];
  }

  const mediaItems = mediaRows
    .filter((row) => !row.content_id || row.content_id === contentId)
    .map((row) => ({
      instagramMediaId: row.instagram_media_id,
      permalink: row.permalink,
      caption: row.caption,
      postedAt: row.posted_at,
    }));

  return suggestInstagramMatchesForContent(mediaItems, content);
}

export async function loadLinkableInstagramContents(
  supabase: SupabaseServerClient,
  organizationId: string,
  excludeMediaId?: string,
) {
  const contents = await loadInstagramContentCandidates(supabase, organizationId);

  return contents
    .filter(
      (content) =>
        !content.instagram_media_id || content.instagram_media_id === excludeMediaId,
    )
    .map((content) => ({
      id: content.id,
      title: content.title,
      publishDate: content.publish_date,
      status: content.status,
    }));
}

export async function loadUnlinkedInstagramPosts(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const mediaRows = await loadMediaInsightRows(supabase, organizationId);

  return mediaRows
    .filter((row) => !row.content_id)
    .map((row) => ({
      instagramMediaId: row.instagram_media_id,
      caption: row.caption,
      permalink: row.permalink,
      postedAt: row.posted_at,
    }));
}

export async function applyInstagramContentLink(
  supabase: SupabaseServerClient,
  organizationId: string,
  contentId: string,
  instagramMediaId: string,
) {
  const [{ data: content, error: contentError }, { data: media, error: mediaError }] =
    await Promise.all([
      supabase
        .from("contents")
        .select(
          `
          id,
          platform,
          title,
          caption,
          status,
          publish_date,
          instagram_media_id,
          instagram_permalink,
          ai_generation_id,
          ai_content_generations ( content_pillar )
        `,
        )
        .eq("id", contentId)
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("instagram_media_insights")
        .select("instagram_media_id, permalink, caption, posted_at, content_id")
        .eq("organization_id", organizationId)
        .eq("instagram_media_id", instagramMediaId)
        .maybeSingle(),
    ]);

  if (contentError) {
    throw new Error(contentError.message);
  }

  if (mediaError) {
    throw new Error(mediaError.message);
  }

  if (!content) {
    throw new Error("Content tidak ditemukan.");
  }

  if (content.platform !== "instagram") {
    throw new Error("Hanya content platform Instagram yang dapat dihubungkan.");
  }

  if (!media) {
    throw new Error("Post Instagram tidak ditemukan. Sinkronisasi analytics terlebih dahulu.");
  }

  const contentRow = content as ContentLinkRow;
  const contentPillar = getContentPillar(contentRow);

  const { data: previousContentForMedia } = await supabase
    .from("contents")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("instagram_media_id", instagramMediaId)
    .neq("id", contentId)
    .maybeSingle();

  if (previousContentForMedia) {
    await supabase
      .from("contents")
      .update({ instagram_media_id: null, instagram_permalink: null })
      .eq("id", previousContentForMedia.id)
      .eq("organization_id", organizationId);
  }

  if (content.instagram_media_id && content.instagram_media_id !== instagramMediaId) {
    await supabase
      .from("instagram_media_insights")
      .update({ content_id: null, content_pillar: null })
      .eq("organization_id", organizationId)
      .eq("instagram_media_id", content.instagram_media_id);
  }

  const { error: updateContentError } = await supabase
    .from("contents")
    .update({
      instagram_media_id: instagramMediaId,
      instagram_permalink: media.permalink,
    })
    .eq("id", contentId)
    .eq("organization_id", organizationId);

  if (updateContentError) {
    throw new Error(updateContentError.message);
  }

  const { error: updateMediaError } = await supabase
    .from("instagram_media_insights")
    .update({
      content_id: contentId,
      content_pillar: contentPillar,
    })
    .eq("organization_id", organizationId)
    .eq("instagram_media_id", instagramMediaId);

  if (updateMediaError) {
    throw new Error(updateMediaError.message);
  }
}

export async function clearInstagramContentLink(
  supabase: SupabaseServerClient,
  organizationId: string,
  input: { contentId?: string; instagramMediaId?: string },
) {
  if (!input.contentId && !input.instagramMediaId) {
    throw new Error("contentId atau instagramMediaId wajib diisi.");
  }

  let contentId = input.contentId;
  let instagramMediaId = input.instagramMediaId;

  if (contentId && !instagramMediaId) {
    const { data } = await supabase
      .from("contents")
      .select("instagram_media_id")
      .eq("id", contentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    instagramMediaId = data?.instagram_media_id ?? undefined;
  }

  if (instagramMediaId && !contentId) {
    const { data } = await supabase
      .from("instagram_media_insights")
      .select("content_id")
      .eq("organization_id", organizationId)
      .eq("instagram_media_id", instagramMediaId)
      .maybeSingle();

    contentId = data?.content_id ?? undefined;
  }

  if (contentId) {
    await supabase
      .from("contents")
      .update({ instagram_media_id: null, instagram_permalink: null })
      .eq("id", contentId)
      .eq("organization_id", organizationId);
  }

  if (instagramMediaId) {
    await supabase
      .from("instagram_media_insights")
      .update({ content_id: null, content_pillar: null })
      .eq("organization_id", organizationId)
      .eq("instagram_media_id", instagramMediaId);
  }
}

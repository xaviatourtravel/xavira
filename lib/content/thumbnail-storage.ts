import { createAdminClient } from "@/utils/supabase/admin";

const THUMBNAIL_BUCKET = "content-thumbnails";

export async function uploadThumbnailImage({
  organizationId,
  generationId,
  variationIndex,
  buffer,
}: {
  organizationId: string;
  generationId: string;
  variationIndex: number;
  buffer: Buffer;
}) {
  const admin = createAdminClient();
  const storagePath = `${organizationId}/${generationId}/${variationIndex + 1}.png`;

  const { error } = await admin.storage
    .from(THUMBNAIL_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = admin.storage.from(THUMBNAIL_BUCKET).getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: data.publicUrl,
  };
}

import OpenAI from "openai";

import {
  getThumbnailImageSize,
  type ThumbnailCoverFormat,
} from "@/lib/ai/thumbnail-studio";

export const THUMBNAIL_IMAGE_MODEL = "gpt-image-1";
export const THUMBNAIL_IMAGE_OUTPUT_FORMAT = "png" as const;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GeneratedThumbnailImage = {
  dataUrl: string;
  buffer: Buffer;
  mimeType: "image/png";
};

export function createThumbnailDataUrl(
  b64Json: string,
  mimeType: "image/png" | "image/jpeg" | "image/webp" = "image/png",
) {
  return `data:${mimeType};base64,${b64Json}`;
}

export async function generateThumbnailImage(
  prompt: string,
  coverFormat: ThumbnailCoverFormat,
): Promise<GeneratedThumbnailImage> {
  const response = await openai.images.generate({
    model: THUMBNAIL_IMAGE_MODEL,
    prompt,
    n: 1,
    size: getThumbnailImageSize(coverFormat),
    output_format: THUMBNAIL_IMAGE_OUTPUT_FORMAT,
    quality: "auto",
  });

  const b64Json = response.data?.[0]?.b64_json;

  if (!b64Json) {
    throw new Error("Gagal menghasilkan thumbnail image.");
  }

  return {
    dataUrl: createThumbnailDataUrl(b64Json),
    buffer: Buffer.from(b64Json, "base64"),
    mimeType: "image/png",
  };
}

import OpenAI from "openai";

import {
  getThumbnailImageSize,
  type ThumbnailCoverFormat,
} from "@/lib/ai/thumbnail-studio";

export const THUMBNAIL_IMAGE_MODEL = "dall-e-3";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateThumbnailImageBuffer(
  prompt: string,
  coverFormat: ThumbnailCoverFormat,
) {
  const response = await openai.images.generate({
    model: THUMBNAIL_IMAGE_MODEL,
    prompt,
    n: 1,
    size: getThumbnailImageSize(coverFormat),
    response_format: "b64_json",
    quality: "standard",
  });

  const imageData = response.data?.[0]?.b64_json;

  if (!imageData) {
    throw new Error("Gagal menghasilkan thumbnail image.");
  }

  return Buffer.from(imageData, "base64");
}

"use client";

import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

export type SceneLocale = "id" | "en";

export function useSceneLocale(): SceneLocale {
  const { locale } = useMarketingContent();
  return locale;
}

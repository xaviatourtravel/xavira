"use client";

import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createStrictTranslator, createTranslator } from "@/lib/i18n/dictionary";
import { useI18nContext } from "@/lib/i18n/provider";

export function useTranslation() {
  const context = useI18nContext();

  if (!context) {
    const t = createTranslator(DEFAULT_LOCALE);
    const tStrict = createStrictTranslator(DEFAULT_LOCALE);
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t,
      tStrict,
      isReady: false,
    };
  }

  return context;
}

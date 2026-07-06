"use client";

import { useCallback } from "react";

import type { BbUiKey } from "@/lib/i18n/bb-ui-dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";

export function useBbTranslation() {
  const { tStrict, locale } = useTranslation();

  const bb = useCallback(
    (key: BbUiKey) => tStrict(`bbUi.${key}`),
    [tStrict],
  );

  return { bb, tStrict, locale };
}

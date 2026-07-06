"use client";

import { useCallback } from "react";

import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";

export function useInboxTranslation() {
  const { tStrict, locale } = useTranslation();

  const ti = useCallback(
    (key: InboxKey) => tStrict(`inbox.${key}`),
    [tStrict],
  );

  return { ti, tStrict, locale };
}

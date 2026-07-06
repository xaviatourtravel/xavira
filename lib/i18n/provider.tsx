"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { createStrictTranslator, createTranslator, type StrictTranslateFn, type TranslateFn } from "@/lib/i18n/dictionary";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
  tStrict: StrictTranslateFn;
  isReady: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * All new UI must use t() or tStrict(). Hardcoded visible labels are not allowed.
 * Add every new string to both id and en dictionaries. See .cursor/rules/i18n-enforcement.mdc
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
    setIsReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);
  const tStrict = useMemo(() => createStrictTranslator(locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      tStrict,
      isReady,
    }),
    [isReady, locale, setLocale, t, tStrict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext() {
  return useContext(I18nContext);
}

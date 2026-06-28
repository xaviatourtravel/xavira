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
  getMarketingContent,
  type MarketingContent,
  type MarketingLocaleCode,
} from "@/lib/marketing/i18n";

const STORAGE_KEY = "desklabs-marketing-locale";

type MarketingLocaleContextValue = {
  locale: MarketingLocaleCode;
  content: MarketingContent;
  setLocale: (locale: MarketingLocaleCode) => void;
};

const MarketingLocaleContext = createContext<MarketingLocaleContextValue | null>(
  null,
);

export function MarketingLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<MarketingLocaleCode>("id");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: MarketingLocaleCode) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "en" ? "en" : "id";
  }, []);

  const value = useMemo(
    () => ({
      locale,
      content: getMarketingContent(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <MarketingLocaleContext.Provider value={value}>
      {children}
    </MarketingLocaleContext.Provider>
  );
}

export function useMarketingContent() {
  const context = useContext(MarketingLocaleContext);
  if (!context) {
    return {
      locale: "id" as const,
      content: getMarketingContent("id"),
      setLocale: () => {},
    };
  }
  return context;
}

export const LOCALE_STORAGE_KEY = "desklabs-locale";

export const LOCALES = ["id", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "id" || value === "en";
}

/** Runs before paint to reduce locale flicker (mirrors theme init). */
export const LOCALE_INIT_SCRIPT = `(function(){try{var l=localStorage.getItem("${LOCALE_STORAGE_KEY}");if(l==="en"||l==="id"){document.documentElement.lang=l}}catch(e){}})();`;

export const LOCALE_LABELS: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

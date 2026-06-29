export type UserPreferences = {
  language: "id" | "en";
  theme: "system" | "light" | "dark";
  timezone: string;
  currency: string;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: "id",
  theme: "system",
  timezone: "Asia/Jakarta",
  currency: "IDR",
};

export const PREFERENCES_STORAGE_KEY = "desklabs.user-preferences";

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT)" },
] as const;

export const CURRENCY_OPTIONS = [{ value: "IDR", label: "Rupiah Indonesia (IDR)" }] as const;

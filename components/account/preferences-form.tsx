"use client";

import { useEffect, useState } from "react";

import { AccountCard } from "@/components/account/account-card";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { Label } from "@/components/ui/label";
import {
  CURRENCY_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  TIMEZONE_OPTIONS,
  type UserPreferences,
} from "@/lib/account/preferences";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

function readStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_USER_PREFERENCES;
    }

    return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(raw) } as UserPreferences;
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function PreferencesForm() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreferences(readStoredPreferences());
    setHydrated(true);
  }, []);

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  if (!hydrated) {
    return null;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Preferensi berhasil disimpan.
        </div>
      ) : null}

      <AccountCard title="Bahasa" description="Pilih bahasa antarmuka Desklabs.">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { value: "id" as const, label: "Indonesia" },
            { value: "en" as const, label: "English" },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                preferences.language === option.value
                  ? "border-slate-900 bg-slate-50 font-medium"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <input
                type="radio"
                name="language"
                value={option.value}
                checked={preferences.language === option.value}
                onChange={() =>
                  setPreferences((current) => ({ ...current, language: option.value }))
                }
                className="h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
      </AccountCard>

      <AccountCard title="Tampilan" description="Atur tema tampilan aplikasi.">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: "system" as const, label: "System" },
            { value: "light" as const, label: "Light" },
            { value: "dark" as const, label: "Dark" },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                preferences.theme === option.value
                  ? "border-slate-900 bg-slate-50 font-medium"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={preferences.theme === option.value}
                onChange={() =>
                  setPreferences((current) => ({ ...current, theme: option.value }))
                }
                className="h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
      </AccountCard>

      <AccountCard title="Regional">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Zona Waktu</Label>
            <select
              id="timezone"
              value={preferences.timezone}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  timezone: event.target.value,
                }))
              }
              className={selectClassName}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Format Mata Uang</Label>
            <select
              id="currency"
              value={preferences.currency}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  currency: event.target.value,
                }))
              }
              className={selectClassName}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AccountCard>

      <div className="flex justify-end">
        <DesklabsButton type="submit" className="h-11 w-full sm:w-auto">
          Simpan Preferensi
        </DesklabsButton>
      </div>
    </form>
  );
}

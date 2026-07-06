"use client";

import { LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

const OPTIONS: Locale[] = ["id", "en"];

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={LOCALE_LABELS[locale]}
      className={cn(
        "grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = locale === option;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLocale(option)}
            className={cn(
              "flex min-h-[44px] items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LOCALE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

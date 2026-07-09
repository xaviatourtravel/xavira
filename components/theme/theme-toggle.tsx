"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { NavIconButton } from "@/components/layout/nav-icon-button";
import {
  useTheme,
  type ThemePreference,
} from "@/components/theme/theme-provider";
import { AURORA_NAV_ICON_SIZE } from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Ikuti sistem", icon: Monitor },
];

/**
 * Pemilih tema bergaya segmented control. Cocok untuk halaman Preferensi dan
 * menu profil.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema tampilan"
      className={cn(
        "grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tombol ikon ringkas untuk topbar. Berganti antara terang dan gelap.
 */
export function ThemeToggleIconButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <NavIconButton
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className={cn("hover:text-foreground", className)}
    >
      {isDark ? (
        <Sun className={AURORA_NAV_ICON_SIZE} strokeWidth={1.75} />
      ) : (
        <Moon className={AURORA_NAV_ICON_SIZE} strokeWidth={1.75} />
      )}
    </NavIconButton>
  );
}

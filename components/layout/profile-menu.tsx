"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

import { signOut } from "@/actions/auth";
import { UserAvatar, formatProfileRoleLabel } from "@/components/layout/user-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  PROFILE_MENU_FLAT_ITEMS,
  PROFILE_MENU_SECTIONS,
  type ProfileMenuItem,
} from "@/lib/navigation/profile-menu-items";
import type { Profile } from "@/types/app-types";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  profile: Profile;
  email?: string | null;
};

function MenuItemLink({
  item,
  isSelected,
  onSelect,
  onClose,
}: {
  item: ProfileMenuItem;
  isSelected: boolean;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const flatIndex = PROFILE_MENU_FLAT_ITEMS.findIndex((entry) => entry.id === item.id);

  return (
    <Link
      role="menuitem"
      href={item.href}
      data-selected={isSelected}
      onMouseEnter={() => {
        if (flatIndex >= 0) {
          onSelect(flatIndex);
        }
      }}
      onClick={onClose}
      className={cn(
        "flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
        isSelected
          ? "bg-muted text-foreground"
          : "text-foreground/80 hover:bg-muted/60",
      )}
    >
      <span>{item.label}</span>
      {item.status === "coming_soon" ? (
        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          {t("common.comingSoon")}
        </span>
      ) : null}
    </Link>
  );
}

function ProfileMenuContent({
  profile,
  email,
  displayName,
  roleLabel,
  selectedItemId,
  onSelect,
  onClose,
  listRef,
}: {
  profile: Profile;
  email?: string | null;
  displayName: string;
  roleLabel: string;
  selectedItemId?: string;
  onSelect: (index: number) => void;
  onClose: () => void;
  listRef?: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <UserAvatar name={displayName} imageUrl={profile.avatar_url} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {email ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
            <span className="mt-2 inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      <div ref={listRef} className="p-2">
        {PROFILE_MENU_SECTIONS.map((section) => (
          <div key={section.id} className="pb-1">
            <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <MenuItemLink
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onSelect={onSelect}
                    onClose={onClose}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-2">
        <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("common.language")}
        </p>
        <div className="px-1 pb-1">
          <LanguageToggle />
        </div>
      </div>

      <div className="border-t border-border p-2">
        <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("common.appearance")}
        </p>
        <div className="px-1 pb-1">
          <ThemeToggle />
        </div>
      </div>

      <div className="border-t border-border p-2">
        <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("common.session")}
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted/60"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            {t("common.signOut")}
          </button>
        </form>
      </div>
    </>
  );
}

export function ProfileMenu({ profile, email }: ProfileMenuProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const displayName = profile.full_name ?? "Pengguna";
  const roleLabel = formatProfileRoleLabel(profile.role);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const menuItemCount = PROFILE_MENU_FLAT_ITEMS.length;

  useEffect(() => {
    if (!open || isMobile) {
      setSelectedIndex(0);
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, isMobile, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % menuItemCount);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) => (index - 1 + menuItemCount) % menuItemCount);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = PROFILE_MENU_FLAT_ITEMS[selectedIndex];
        if (item) {
          close();
          window.location.href = item.href;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, menuItemCount, open, selectedIndex]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }

    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex]);

  const selectedItemId = useMemo(
    () => PROFILE_MENU_FLAT_ITEMS[selectedIndex]?.id,
    [selectedIndex],
  );

  const menuContent = (
    <ProfileMenuContent
      profile={profile}
      email={email}
      displayName={displayName}
      roleLabel={roleLabel}
      selectedItemId={selectedItemId}
      onSelect={setSelectedIndex}
      onClose={close}
      listRef={listRef}
    />
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-xl pl-1 pr-2 transition-colors duration-150 ease-out hover:bg-muted/20",
          open && "bg-muted/20",
        )}
      >
        <UserAvatar
          name={displayName}
          imageUrl={profile.avatar_url}
          size="sm"
          className="h-7 w-7 shrink-0"
        />
        <span className="hidden max-w-[100px] truncate text-[13px] font-medium text-foreground sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200 sm:block",
            open && "rotate-180",
          )}
          strokeWidth={1.75}
        />
      </button>

      {open && isMobile ? (
        <MobileSheet
          open={open}
          onClose={close}
          title={displayName}
          subtitle={roleLabel}
          ariaLabel="Menu akun"
          contentClassName="pb-2"
        >
          {menuContent}
        </MobileSheet>
      ) : null}

      {open && !isMobile ? (
        <div
          role="menu"
          aria-label="Menu akun"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          {menuContent}
        </div>
      ) : null}
    </div>
  );
}

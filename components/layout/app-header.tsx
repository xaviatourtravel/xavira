"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/app-types";

export function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur md:h-14 md:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold md:hidden">Desklabs</p>
        <p className="hidden truncate text-sm font-medium md:block">
          {profile.full_name ?? "User"}
        </p>
        <p className="hidden text-xs capitalize text-muted-foreground md:block">
          {profile.role}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden max-w-[120px] truncate text-xs text-muted-foreground sm:inline md:hidden">
          {profile.full_name ?? "User"}
        </span>
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="min-h-[44px] min-w-[44px] px-3 md:min-h-0 md:min-w-0"
          >
            Keluar
          </Button>
        </form>
      </div>
    </header>
  );
}

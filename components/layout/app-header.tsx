"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/app-types";

export function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div>
        <p className="text-sm font-medium">{profile.full_name ?? "User"}</p>
        <p className="text-xs capitalize text-muted-foreground">{profile.role}</p>
      </div>

      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Keluar
        </Button>
      </form>
    </header>
  );
}

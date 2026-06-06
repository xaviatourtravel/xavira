"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type ProfileOption = {
  id: string;
  full_name: string;
};

type LeadKanbanFiltersProps = {
  search: string;
  assigned: string;
  status: string;
  profiles: ProfileOption[];
};

export function LeadKanbanFilters({
  search: initialSearch,
  assigned,
  status,
  profiles,
}: LeadKanbanFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [, startTransition] = useTransition();

  const hasFilters =
    initialSearch.length > 0 || assigned.length > 0 || status.length > 0;

  const pushFilters = useCallback(
    (updates: { q?: string; assigned?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.q !== undefined) {
        const value = updates.q.trim();
        if (value) {
          params.set("q", value);
        } else {
          params.delete("q");
        }
      }

      if (updates.assigned !== undefined) {
        if (updates.assigned) {
          params.set("assigned", updates.assigned);
        } else {
          params.delete("assigned");
        }
      }

      const query = params.toString();

      startTransition(() => {
        router.replace(query ? `/leads/kanban?${query}` : "/leads/kanban");
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === initialSearch) {
      return;
    }

    const timeout = window.setTimeout(() => {
      pushFilters({ q: trimmed });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, initialSearch, pushFilters]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cari nama, paket, atau nomor WA..."
        className="min-w-[220px] flex-1 rounded-md border px-3 py-2 text-sm"
      />

      <select
        value={assigned}
        onChange={(event) => pushFilters({ assigned: event.target.value })}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">All Users</option>
        <option value="unassigned">Unassigned</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.full_name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <Link
          href="/leads/kanban"
          className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Reset
        </Link>
      )}
    </div>
  );
}

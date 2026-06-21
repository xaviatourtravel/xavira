"use client";

import { Search } from "lucide-react";

type InboxConversationSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function InboxConversationSearch({
  value,
  onChange,
}: InboxConversationSearchProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search name, phone, or message…"
        className="h-9 w-full rounded-full border border-border/60 bg-muted/25 pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
      />
    </div>
  );
}

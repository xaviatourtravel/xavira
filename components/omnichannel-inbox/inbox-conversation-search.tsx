"use client";

import { Search } from "lucide-react";

import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

type InboxConversationSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function InboxConversationSearch({
  value,
  onChange,
}: InboxConversationSearchProps) {
  const { ti } = useInboxTranslation();

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={ti("conversationSearchPlaceholder")}
        className="h-9 w-full rounded-xl border-0 bg-muted/20 pl-9 pr-3 text-sm outline-none ring-offset-background transition-colors duration-150 placeholder:text-muted-foreground focus-visible:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/15 dark:bg-muted/10"
      />
    </div>
  );
}

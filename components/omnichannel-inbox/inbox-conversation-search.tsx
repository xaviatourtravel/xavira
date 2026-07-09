"use client";

import { Search } from "lucide-react";

import { AURORA_QUEUE_SEARCH_CLASS } from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

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
    <div className="relative min-w-0">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={ti("conversationSearchPlaceholder")}
        aria-label={ti("conversationSearchPlaceholder")}
        className={cn(AURORA_QUEUE_SEARCH_CLASS)}
      />
    </div>
  );
}

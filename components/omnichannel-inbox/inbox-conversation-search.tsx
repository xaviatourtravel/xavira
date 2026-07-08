"use client";

import { WorkspaceHeaderSearch } from "@/components/workspace";
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
    <WorkspaceHeaderSearch
      value={value}
      onChange={onChange}
      placeholder={ti("conversationSearchPlaceholder")}
      ariaLabel={ti("conversationSearchPlaceholder")}
    />
  );
}

"use client";

import { History, Paperclip, Sparkles, UserRound } from "lucide-react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import type { WorkspaceTabId } from "@/modules/inbox/context/workspace-tab-context";

const TAB_ITEMS: Array<{
  id: WorkspaceTabId;
  labelKey: InboxKey;
  icon: typeof Sparkles;
}> = [
  { id: "copilot", labelKey: "workspaceTabCopilot", icon: Sparkles },
  { id: "customer360", labelKey: "workspaceTabCustomer360", icon: UserRound },
  { id: "files", labelKey: "workspaceTabFiles", icon: Paperclip },
  { id: "activity", labelKey: "workspaceTabActivity", icon: History },
];

export function WorkspaceTabNav() {
  const { ti } = useInboxTranslation();

  return (
    <TabsList aria-label={ti("workspaceNavLabel")}>
      {TAB_ITEMS.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger key={tab.id} value={tab.id} icon={<Icon aria-hidden />}>
            {ti(tab.labelKey)}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

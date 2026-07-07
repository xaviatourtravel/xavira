"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import type { WorkspaceTabId } from "@/modules/inbox/context/workspace-tab-context";

const TAB_ITEMS: Array<{
  id: WorkspaceTabId;
  labelKey: InboxKey;
}> = [
  { id: "copilot", labelKey: "workspaceTabCopilot" },
  { id: "customer360", labelKey: "workspaceTabCustomer360" },
  { id: "files", labelKey: "workspaceTabFiles" },
  { id: "activity", labelKey: "workspaceTabActivity" },
];

export function WorkspaceTabNav() {
  const { ti } = useInboxTranslation();

  return (
    <TabsList aria-label={ti("workspaceNavLabel")} className="border-b border-border/20 px-3 py-2">
      {TAB_ITEMS.map((tab) => (
        <TabsTrigger key={tab.id} value={tab.id}>
          {ti(tab.labelKey)}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

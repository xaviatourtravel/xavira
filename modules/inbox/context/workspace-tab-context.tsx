"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkspaceTabId = "copilot" | "customer360" | "files" | "activity";

type WorkspaceTabContextValue = {
  activeTab: WorkspaceTabId;
  setActiveTab: (tab: WorkspaceTabId) => void;
  bindConversation: (conversationId: string | null) => void;
};

const WorkspaceTabContext = createContext<WorkspaceTabContextValue | null>(null);

export function WorkspaceTabProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<WorkspaceTabId>("copilot");

  const bindConversation = useCallback((nextConversationId: string | null) => {
    setConversationId((current) => {
      if (current !== nextConversationId) {
        setActiveTabState("copilot");
      }
      return nextConversationId;
    });
  }, []);

  const setActiveTab = useCallback((tab: WorkspaceTabId) => {
    setActiveTabState(tab);
  }, []);

  const value = useMemo(
    () => ({ activeTab, setActiveTab, bindConversation, conversationId }),
    [activeTab, setActiveTab, bindConversation, conversationId],
  );

  return (
    <WorkspaceTabContext.Provider
      value={{
        activeTab: value.activeTab,
        setActiveTab: value.setActiveTab,
        bindConversation: value.bindConversation,
      }}
    >
      {children}
    </WorkspaceTabContext.Provider>
  );
}

export function useWorkspaceTab() {
  const context = useContext(WorkspaceTabContext);
  if (!context) {
    throw new Error("useWorkspaceTab must be used within WorkspaceTabProvider");
  }
  return context;
}

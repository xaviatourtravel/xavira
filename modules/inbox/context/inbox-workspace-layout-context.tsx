"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useWorkspaceTab,
  WorkspaceTabProvider,
  type WorkspaceTabId,
} from "@/modules/inbox/context/workspace-tab-context";

type InboxWorkspaceLayoutContextValue = {
  /** Permanent inspector removed — conversation lane always uses full width */
  inspectorOpen: boolean;
  contextSheetOpen: boolean;
  openContextSheet: (tab?: WorkspaceTabId) => void;
  closeContextSheet: () => void;
  toggleContextSheet: () => void;
};

const InboxWorkspaceLayoutContext = createContext<InboxWorkspaceLayoutContextValue>({
  inspectorOpen: false,
  contextSheetOpen: false,
  openContextSheet: () => {},
  closeContextSheet: () => {},
  toggleContextSheet: () => {},
});

function InboxWorkspaceLayoutProviderInner({ children }: { children: ReactNode }) {
  const { setActiveTab } = useWorkspaceTab();
  const [contextSheetOpen, setContextSheetOpen] = useState(false);

  const openContextSheet = useCallback(
    (tab?: WorkspaceTabId) => {
      if (tab) {
        setActiveTab(tab);
      }
      setContextSheetOpen(true);
    },
    [setActiveTab],
  );

  const closeContextSheet = useCallback(() => {
    setContextSheetOpen(false);
  }, []);

  const toggleContextSheet = useCallback(() => {
    setContextSheetOpen((open) => !open);
  }, []);

  const value = useMemo(
    () => ({
      inspectorOpen: false,
      contextSheetOpen,
      openContextSheet,
      closeContextSheet,
      toggleContextSheet,
    }),
    [contextSheetOpen, openContextSheet, closeContextSheet, toggleContextSheet],
  );

  return (
    <InboxWorkspaceLayoutContext.Provider value={value}>
      {children}
    </InboxWorkspaceLayoutContext.Provider>
  );
}

export function InboxWorkspaceLayoutProvider({ children }: { children: ReactNode }) {
  return (
    <WorkspaceTabProvider>
      <InboxWorkspaceLayoutProviderInner>{children}</InboxWorkspaceLayoutProviderInner>
    </WorkspaceTabProvider>
  );
}

export function useInboxWorkspaceLayout() {
  return useContext(InboxWorkspaceLayoutContext);
}

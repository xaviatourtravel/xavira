"use client";

import { createContext, useContext, type ReactNode } from "react";

type InboxWorkspaceLayoutContextValue = {
  inspectorOpen: boolean;
};

const InboxWorkspaceLayoutContext = createContext<InboxWorkspaceLayoutContextValue>({
  inspectorOpen: true,
});

export function InboxWorkspaceLayoutProvider({
  inspectorOpen,
  children,
}: {
  inspectorOpen: boolean;
  children: ReactNode;
}) {
  return (
    <InboxWorkspaceLayoutContext.Provider value={{ inspectorOpen }}>
      {children}
    </InboxWorkspaceLayoutContext.Provider>
  );
}

export function useInboxWorkspaceLayout() {
  return useContext(InboxWorkspaceLayoutContext);
}

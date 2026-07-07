"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { toggleWorkspaceAiChatAction } from "@/app/(dashboard)/inbox/ai-workspace-actions";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";

type InboxAiWorkspaceContextValue = {
  aiChatEnabled: boolean;
  canManageGlobalAi: boolean;
  isGlobalTogglePending: boolean;
  setAiChatEnabled: (enabled: boolean) => void;
};

const InboxAiWorkspaceContext = createContext<InboxAiWorkspaceContextValue>({
  aiChatEnabled: true,
  canManageGlobalAi: false,
  isGlobalTogglePending: false,
  setAiChatEnabled: () => {},
});

export function InboxAiWorkspaceProvider({
  aiChatEnabled,
  canManageGlobalAi,
  children,
}: {
  aiChatEnabled: boolean;
  canManageGlobalAi: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(aiChatEnabled);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEnabled(aiChatEnabled);
  }, [aiChatEnabled]);

  const setAiChatEnabled = useCallback(
    (nextEnabled: boolean) => {
      if (!canManageGlobalAi || isPending) {
        return;
      }

      startTransition(async () => {
        const result = await toggleWorkspaceAiChatAction(nextEnabled);

        if (!result.success) {
          logInboxError("toggleWorkspaceAiChat", result.message);
          return;
        }

        setEnabled(nextEnabled);
        router.refresh();
      });
    },
    [canManageGlobalAi, isPending, router],
  );

  return (
    <InboxAiWorkspaceContext.Provider
      value={{
        aiChatEnabled: enabled,
        canManageGlobalAi,
        isGlobalTogglePending: isPending,
        setAiChatEnabled,
      }}
    >
      {children}
    </InboxAiWorkspaceContext.Provider>
  );
}

export function useInboxAiWorkspace() {
  return useContext(InboxAiWorkspaceContext);
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

type InsertHandler = (text: string) => void;

type InboxComposerContextValue = {
  insertText: (text: string) => void;
  registerInsertHandler: (handler: InsertHandler | null) => void;
};

const InboxComposerContext = createContext<InboxComposerContextValue | null>(null);

export function InboxComposerProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<InsertHandler | null>(null);

  const registerInsertHandler = useCallback((handler: InsertHandler | null) => {
    handlerRef.current = handler;
  }, []);

  const insertText = useCallback((text: string) => {
    handlerRef.current?.(text);
  }, []);

  return (
    <InboxComposerContext.Provider value={{ insertText, registerInsertHandler }}>
      {children}
    </InboxComposerContext.Provider>
  );
}

export function useInboxComposer() {
  const context = useContext(InboxComposerContext);
  if (!context) {
    return {
      insertText: () => {},
      registerInsertHandler: () => {},
    };
  }
  return context;
}

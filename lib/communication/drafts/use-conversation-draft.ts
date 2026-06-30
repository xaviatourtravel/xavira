"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearDraft as clearDraftStore,
  loadDraft,
  saveDraft,
} from "@/lib/communication/drafts/draft-storage";

export function useConversationDraft(conversationId: string) {
  const [draft, setDraftState] = useState<string>(() =>
    loadDraft(conversationId),
  );
  const conversationRef = useRef(conversationId);

  useEffect(() => {
    if (conversationRef.current !== conversationId) {
      conversationRef.current = conversationId;
      setDraftState(loadDraft(conversationId));
    }
  }, [conversationId]);

  const setDraft = useCallback((value: string) => {
    setDraftState(value);
    saveDraft(conversationRef.current, value);
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState("");
    clearDraftStore(conversationRef.current);
  }, []);

  return { draft, setDraft, clearDraft };
}

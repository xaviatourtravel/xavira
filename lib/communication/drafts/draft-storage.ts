// Persistensi draft netral kanal. Draft bertahan saat berpindah percakapan
// (in-memory) dan saat halaman dimuat ulang (localStorage), dengan kunci
// `desklabs:draft:{conversationId}` sehingga kanal mana pun dapat memakainya.

const STORAGE_PREFIX = "desklabs:draft:";
const memoryDrafts = new Map<string, string>();

function storageKey(conversationId: string) {
  return `${STORAGE_PREFIX}${conversationId}`;
}

export function loadDraft(conversationId: string): string {
  if (!conversationId) {
    return "";
  }

  if (memoryDrafts.has(conversationId)) {
    return memoryDrafts.get(conversationId) ?? "";
  }

  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(storageKey(conversationId)) ?? "";
  } catch {
    return "";
  }
}

export function saveDraft(conversationId: string, value: string): void {
  if (!conversationId) {
    return;
  }

  if (value) {
    memoryDrafts.set(conversationId, value);
  } else {
    memoryDrafts.delete(conversationId);
  }

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(storageKey(conversationId), value);
    } else {
      window.localStorage.removeItem(storageKey(conversationId));
    }
  } catch {
    // Abaikan kegagalan storage (mode privat, kuota) - in-memory tetap menyimpan.
  }
}

export function clearDraft(conversationId: string): void {
  saveDraft(conversationId, "");
}

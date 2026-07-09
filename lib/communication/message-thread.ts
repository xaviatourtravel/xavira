import type { MessageRow } from "@/types/omnichannel-inbox";

export type MessageThreadDateItem = {
  type: "date";
  key: string;
  dateKey: string;
  label: string;
};

export type MessageGroupPosition = "single" | "first" | "middle" | "last";

export type MessageThreadMessageItem = {
  type: "message";
  key: string;
  message: MessageRow;
  groupPosition: MessageGroupPosition;
};

export type MessageThreadUnreadItem = {
  type: "unread";
  key: string;
};

export type MessageThreadItem =
  | MessageThreadDateItem
  | MessageThreadUnreadItem
  | MessageThreadMessageItem;

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export function getMessageDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
  }).format(new Date(value));
}

export function formatMessageDateSeparatorLabel(
  dateKey: string,
  locale: string,
  labels: { today: string; yesterday: string },
) {
  const todayKey = getMessageDateKey(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = getMessageDateKey(yesterdayDate.toISOString());

  if (dateKey === todayKey) {
    return labels.today;
  }

  if (dateKey === yesterdayKey) {
    return labels.yesterday;
  }

  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(new Date(`${dateKey}T12:00:00`));
}

export function getFirstUnreadMessageId(
  messages: MessageRow[],
  unreadCount: number,
): string | null {
  if (unreadCount <= 0 || messages.length === 0) {
    return null;
  }

  const startIndex = Math.max(0, messages.length - unreadCount);
  return messages[startIndex]?.id ?? null;
}

function annotateMessageGroups(items: MessageThreadItem[]): MessageThreadItem[] {
  const messageIndices = items
    .map((item, index) => (item.type === "message" ? index : -1))
    .filter((index) => index >= 0);

  return items.map((item, index) => {
    if (item.type !== "message") {
      return item;
    }

    const positionInMessages = messageIndices.indexOf(index);
    const previousItem =
      positionInMessages > 0 ? items[messageIndices[positionInMessages - 1]!] : null;
    const nextItem =
      positionInMessages < messageIndices.length - 1
        ? items[messageIndices[positionInMessages + 1]!]
        : null;

    const samePrevious =
      previousItem?.type === "message" &&
      previousItem.message.direction === item.message.direction;
    const sameNext =
      nextItem?.type === "message" &&
      nextItem.message.direction === item.message.direction;

    let groupPosition: MessageGroupPosition = "single";
    if (samePrevious && sameNext) {
      groupPosition = "middle";
    } else if (samePrevious) {
      groupPosition = "last";
    } else if (sameNext) {
      groupPosition = "first";
    }

    return {
      ...item,
      groupPosition,
    };
  });
}

export function buildMessageThreadItems(
  messages: MessageRow[],
  labels: { today: string; yesterday: string },
  locale: string,
  options?: { firstUnreadMessageId?: string | null },
): MessageThreadItem[] {
  if (messages.length === 0) {
    return [];
  }

  const firstUnreadMessageId = options?.firstUnreadMessageId ?? null;
  const items: MessageThreadItem[] = [];
  let lastDateKey: string | null = null;
  let unreadSeparatorInserted = false;

  for (const message of messages) {
    const dateKey = getMessageDateKey(message.created_at);

    if (dateKey !== lastDateKey) {
      items.push({
        type: "date",
        key: `date-${dateKey}`,
        dateKey,
        label: formatMessageDateSeparatorLabel(dateKey, locale, labels),
      });
      lastDateKey = dateKey;
    }

    if (
      !unreadSeparatorInserted &&
      firstUnreadMessageId &&
      message.id === firstUnreadMessageId
    ) {
      items.push({
        type: "unread",
        key: "unread-divider",
      });
      unreadSeparatorInserted = true;
    }

    items.push({
      type: "message",
      key: message.id,
      message,
      groupPosition: "single",
    });
  }

  return annotateMessageGroups(items);
}

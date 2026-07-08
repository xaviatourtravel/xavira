import type { MessageRow } from "@/types/omnichannel-inbox";

export type MessageThreadDateItem = {
  type: "date";
  key: string;
  dateKey: string;
  label: string;
};

export type MessageThreadMessageItem = {
  type: "message";
  key: string;
  message: MessageRow;
};

export type MessageThreadItem = MessageThreadDateItem | MessageThreadMessageItem;

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

export function buildMessageThreadItems(
  messages: MessageRow[],
  labels: { today: string; yesterday: string },
  locale: string,
): MessageThreadItem[] {
  if (messages.length === 0) {
    return [];
  }

  const items: MessageThreadItem[] = [];
  let lastDateKey: string | null = null;

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

    items.push({
      type: "message",
      key: message.id,
      message,
    });
  }

  return items;
}

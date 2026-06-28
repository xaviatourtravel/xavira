export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  count?: number;
};

export type NotificationSummary = {
  items: NotificationItem[];
  totalCount: number;
};

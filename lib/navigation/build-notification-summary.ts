import type { NavAttentionBadges } from "@/config/navigation";
import type { NotificationSummary } from "@/lib/navigation/notification-types";

export function buildNotificationSummary(
  badges: NavAttentionBadges,
): NotificationSummary {
  const items = [];

  if (badges.communication > 0) {
    items.push({
      id: "unread-messages",
      title: "Pesan belum dibaca",
      description: `${badges.communication} percakapan menunggu respons`,
      href: "/inbox",
      count: badges.communication,
    });
  }

  if (badges.operational > 0) {
    items.push({
      id: "operational-tasks",
      title: "Follow up & task operasional",
      description: `${badges.operational} item perlu ditindaklanjuti`,
      href: "/operations",
      count: badges.operational,
    });
  }

  if (badges.finance > 0) {
    items.push({
      id: "payments-confirm",
      title: "Pembayaran perlu konfirmasi",
      description: `${badges.finance} pembayaran menunggu verifikasi`,
      href: "/revenue",
      count: badges.finance,
    });
  }

  const totalCount = badges.communication + badges.operational + badges.finance;

  return { items, totalCount };
}

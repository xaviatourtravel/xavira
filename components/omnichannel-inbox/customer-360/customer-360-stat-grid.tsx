"use client";

import {
  AURORA_CUSTOMER_360_STAT_CARD,
  AURORA_CUSTOMER_360_STAT_GRID,
  AURORA_CUSTOMER_360_STAT_LABEL,
  AURORA_CUSTOMER_360_STAT_VALUE,
  AURORA_CUSTOMER_360_SUBSECTION_TITLE,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

import type { Customer360QuickStats } from "./types";

type Customer360StatGridProps = {
  stats: Customer360QuickStats;
};

export function Customer360StatGrid({ stats }: Customer360StatGridProps) {
  const { ti } = useInboxTranslation();

  const items = [
    { label: ti("customer360StatConversations"), value: stats.conversations },
    { label: ti("customer360StatBookings"), value: stats.bookings },
    { label: ti("customer360StatTrips"), value: stats.trips },
    { label: ti("customer360StatLastContact"), value: stats.lastContact },
    { label: ti("customer360StatAvgResponse"), value: stats.averageResponse },
    { label: ti("customer360StatLifetimeValue"), value: stats.lifetimeValue },
  ] as const;

  return (
    <section aria-labelledby="customer-360-stats-heading">
      <h4 id="customer-360-stats-heading" className={AURORA_CUSTOMER_360_SUBSECTION_TITLE}>
        {ti("customer360QuickStats")}
      </h4>
      <div className={`${AURORA_CUSTOMER_360_STAT_GRID} mt-2.5`} role="list" aria-label={ti("customer360QuickStats")}>
        {items.map((item) => (
          <div key={item.label} role="listitem" className={AURORA_CUSTOMER_360_STAT_CARD}>
            <p className={AURORA_CUSTOMER_360_STAT_LABEL}>{item.label}</p>
            <p className={AURORA_CUSTOMER_360_STAT_VALUE}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

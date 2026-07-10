"use client";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import {
  AURORA_SNAPSHOT_HEADER_CHANNEL,
  AURORA_SNAPSHOT_HEADER_META,
  AURORA_SNAPSHOT_HEADER_NAME,
  AURORA_SNAPSHOT_LEAD_BADGE,
} from "@/components/workspace/aurora-tokens";

import type { CustomerSnapshotHeader, CustomerSnapshotLabels } from "./types";

type CustomerSnapshotHeaderSectionProps = {
  header: CustomerSnapshotHeader;
  labels: CustomerSnapshotLabels;
};

export function CustomerSnapshotHeaderSection({
  header,
  labels,
}: CustomerSnapshotHeaderSectionProps) {
  return (
    <header className="flex gap-3">
      <CustomerAvatar
        displayName={header.name}
        avatarUrl={header.avatarUrl}
        size="sm"
        className="h-9 w-9 shrink-0"
        channel={
          header.channel === "whatsapp"
            ? "whatsapp"
            : header.channel === "instagram"
              ? "instagram"
              : header.channel === "facebook"
                ? "facebook"
                : "default"
        }
      />

      <div className="min-w-0 flex-1">
        <h4 className={AURORA_SNAPSHOT_HEADER_NAME}>{header.name}</h4>
        <div className="mt-1 flex flex-col gap-0.5">
          <p className={AURORA_SNAPSHOT_HEADER_CHANNEL}>{header.channelLabel}</p>
          <p className={AURORA_SNAPSHOT_HEADER_META}>{header.statusLabel}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={AURORA_SNAPSHOT_LEAD_BADGE}>
            {header.leadBadge.label}
            <span aria-hidden> · </span>
            {header.leadBadge.value}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {labels.joinedSince}
            <span aria-hidden> · </span>
            <span className="font-medium text-foreground/85">{header.joinedSince}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

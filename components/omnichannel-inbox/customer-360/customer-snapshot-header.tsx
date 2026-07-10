"use client";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import {
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
    <header className="flex gap-2.5">
      <CustomerAvatar
        displayName={header.name}
        avatarUrl={header.avatarUrl}
        size="sm"
        className="h-10 w-10 shrink-0"
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
        <p className={AURORA_SNAPSHOT_HEADER_META}>
          {header.channelLabel}
          <span aria-hidden> · </span>
          {header.statusLabel}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={AURORA_SNAPSHOT_LEAD_BADGE}>
            {header.leadBadge.label}
            <span aria-hidden> · </span>
            {header.leadBadge.value}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {labels.joinedSince}
            <span aria-hidden> · </span>
            <span className="font-medium text-foreground">{header.joinedSince}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

"use client";

import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import {
  AURORA_ASSIGNMENT_OWNER_CARD,
  AURORA_ASSIGNMENT_STATUS_AWAY,
  AURORA_ASSIGNMENT_STATUS_OFFLINE,
  AURORA_ASSIGNMENT_STATUS_ONLINE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { AssignmentLabels, Owner, OwnerStatus } from "./types";

function getStatusLabel(status: OwnerStatus, labels: AssignmentLabels) {
  if (status === "online") {
    return labels.statusOnline;
  }
  if (status === "away") {
    return labels.statusAway;
  }
  return labels.statusOffline;
}

function getStatusDotClass(status: OwnerStatus) {
  if (status === "online") {
    return AURORA_ASSIGNMENT_STATUS_ONLINE;
  }
  if (status === "away") {
    return AURORA_ASSIGNMENT_STATUS_AWAY;
  }
  return AURORA_ASSIGNMENT_STATUS_OFFLINE;
}

type OwnerCardProps = {
  owner: Owner;
  labels: AssignmentLabels;
  className?: string;
};

export function OwnerCard({ owner, labels, className }: OwnerCardProps) {
  return (
    <div className={cn(AURORA_ASSIGNMENT_OWNER_CARD, className)}>
      <DesklabsAvatar
        name={owner.name}
        imageUrl={owner.avatar}
        size="md"
        className="h-10 w-10 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{owner.name}</p>
        <p className="truncate text-xs text-muted-foreground">{owner.role}</p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn("h-1.5 w-1.5 rounded-full", getStatusDotClass(owner.status))}
            aria-hidden
          />
          {getStatusLabel(owner.status, labels)}
        </p>
      </div>
    </div>
  );
}

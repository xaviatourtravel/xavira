"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";

import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import {
  AURORA_ASSIGNMENT_STATUS_AWAY,
  AURORA_ASSIGNMENT_STATUS_OFFLINE,
  AURORA_ASSIGNMENT_STATUS_ONLINE,
  AURORA_ASSIGNMENT_TEAM_ROW,
  AURORA_ASSIGNMENT_TEAM_ROW_SELECTED,
  AURORA_ASSIGNMENT_WORKLOAD_BADGE,
} from "@/components/workspace/aurora-tokens";
import { formatTranslation } from "@/lib/i18n/dictionary";
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

type TeamMemberRowProps = {
  member: Owner;
  labels: AssignmentLabels;
  isCurrentOwner?: boolean;
  onSelect?: () => void;
  className?: string;
};

export const TeamMemberRow = forwardRef<HTMLButtonElement, TeamMemberRowProps>(
  function TeamMemberRow(
    {
      member,
      labels,
      isCurrentOwner = false,
      onSelect,
      className,
    },
    ref,
  ) {
  const workloadLabel = formatTranslation(labels.workloadChats, {
    count: String(member.workload),
  });

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isCurrentOwner}
      onClick={onSelect}
      className={cn(
        AURORA_ASSIGNMENT_TEAM_ROW,
        isCurrentOwner && AURORA_ASSIGNMENT_TEAM_ROW_SELECTED,
        className,
      )}
    >
      <DesklabsAvatar
        name={member.name}
        imageUrl={member.avatar}
        size="sm"
        className="h-9 w-9 shrink-0"
      />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-foreground">
          {member.name}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {member.role}
        </span>
      </span>
      <span className={AURORA_ASSIGNMENT_WORKLOAD_BADGE}>{workloadLabel}</span>
      <span className="inline-flex w-16 shrink-0 items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", getStatusDotClass(member.status))}
          aria-hidden
        />
        {getStatusLabel(member.status, labels)}
      </span>
      {isCurrentOwner ? (
        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      ) : (
        <span className="h-4 w-4 shrink-0" aria-hidden />
      )}
    </button>
  );
  },
);

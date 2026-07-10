"use client";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import {
  AURORA_CUSTOMER_360_LEAD_SCORE,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

import type { Customer360ProfileHeader } from "./types";

type Customer360ProfileHeaderProps = {
  profile: Customer360ProfileHeader;
};

export function Customer360ProfileHeaderSection({
  profile,
}: Customer360ProfileHeaderProps) {
  const { ti } = useInboxTranslation();

  return (
    <header className="flex gap-3">
      <CustomerAvatar
        displayName={profile.name}
        avatarUrl={profile.avatarUrl}
        size="md"
        className="h-12 w-12 shrink-0"
        channel={
          profile.channel === "whatsapp"
            ? "whatsapp"
            : profile.channel === "instagram"
              ? "instagram"
              : profile.channel === "facebook"
                ? "facebook"
                : "default"
        }
      />

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-base font-semibold text-foreground">{profile.name}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {profile.channelLabel}
          <span aria-hidden> · </span>
          {profile.statusLabel}
        </p>

        <dl className="mt-2.5 space-y-1">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-xs">
            <dt className="text-muted-foreground/70">{ti("customer360JoinedSince")}</dt>
            <dd className="truncate font-medium text-foreground">{profile.joinedSince}</dd>
          </div>
        </dl>

        <div className="mt-2.5">
          <span className={AURORA_CUSTOMER_360_LEAD_SCORE} aria-label={ti("customer360LeadScore")}>
            {profile.leadScore.label}
            <span aria-hidden> · </span>
            {profile.leadScore.value}
          </span>
        </div>
      </div>
    </header>
  );
}

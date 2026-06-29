"use client";

import { useMemo } from "react";

import { CustomerPassportPanel } from "@/components/customer-passport/customer-passport-panel";
import { mapPassportFromConversation } from "@/lib/customer-passport/map-from-conversation";
import type { CustomerPassportVariant } from "@/lib/customer-passport/types";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type CustomerPassportFromConversationProps = {
  conversation: OmnichannelConversationDetail;
  variant?: CustomerPassportVariant;
  showOpenLink?: boolean;
  className?: string;
};

export function CustomerPassportFromConversation({
  conversation,
  variant = "compact",
  showOpenLink = true,
  className,
}: CustomerPassportFromConversationProps) {
  const passport = useMemo(
    () => mapPassportFromConversation(conversation),
    [conversation],
  );

  return (
    <CustomerPassportPanel
      passport={passport}
      variant={variant}
      showOpenLink={showOpenLink}
      className={className}
    />
  );
}

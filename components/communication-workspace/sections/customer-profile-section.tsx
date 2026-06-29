import { memo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { WorkspaceChannelBadge } from "@/components/communication-workspace/workspace-channel-badge";
import {
  IntelligenceSection,
  IntelligenceSurface,
} from "@/components/communication-workspace/primitives";
import { buttonVariants } from "@/components/ui/button";
import type { WorkspaceConversationViewModel } from "@/lib/communication-workspace/types";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import { cn } from "@/lib/utils";

function LeadBadge({ type }: { type: WorkspaceConversationViewModel["leadBadge"] }) {
  const styles = {
    prospect: "bg-neutral-100 text-neutral-600",
    lead: "bg-emerald-50 text-emerald-700",
    customer: "bg-sky-50 text-sky-700",
  };

  const labels = {
    prospect: "Prospect",
    lead: "Lead",
    customer: "Customer",
  };

  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        styles[type],
      )}
    >
      {labels[type]}
    </span>
  );
}

type CustomerProfileSectionProps = {
  workspace: WorkspaceConversationViewModel;
};

export const CustomerProfileSection = memo(function CustomerProfileSection({
  workspace,
}: CustomerProfileSectionProps) {
  return (
    <IntelligenceSection title="Customer Profile">
      <IntelligenceSurface className="p-4">
        <div className="flex items-start gap-3.5">
          <CustomerAvatar
            displayName={workspace.displayName}
            avatarUrl={workspace.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                {workspace.displayName}
              </p>
              <LeadBadge type={workspace.leadBadge} />
            </div>

            {workspace.phone ? (
              <p className="mt-1 text-xs text-muted-foreground">{workspace.phone}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground/70">
                No phone on file
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <WorkspaceChannelBadge channel={workspace.channel} />
              <span className="text-[11px] text-muted-foreground">
                {workspace.channelLabel}
              </span>
            </div>
          </div>
        </div>

        {workspace.leadId ? (
          <Link
            href={customerWorkspaceHref(workspace.leadId)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-4 h-8 w-full gap-1.5 border-neutral-200/80 text-xs font-medium shadow-none",
            )}
          >
            Open customer record
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </IntelligenceSurface>
    </IntelligenceSection>
  );
});

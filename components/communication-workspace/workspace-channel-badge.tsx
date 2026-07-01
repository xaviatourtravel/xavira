import { isOmnichannelChannel } from "@/lib/omnichannel-inbox/constants";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import type { WorkspaceChannel } from "@/lib/communication-workspace/types";
import { cn } from "@/lib/utils";

const FUTURE_CHANNEL_STYLES: Record<
  Exclude<WorkspaceChannel, "instagram" | "facebook" | "whatsapp">,
  { label: string; className: string }
> = {
  email: {
    label: "Email",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-500/15 dark:text-slate-300",
  },
  telegram: {
    label: "Telegram",
    className:
      "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
  },
  website_chat: {
    label: "Website",
    className:
      "bg-primary/10 text-primary ring-1 ring-primary/20 dark:bg-primary/15 dark:text-primary-foreground/90",
  },
};

export function WorkspaceChannelBadge({
  channel,
  className,
}: {
  channel: WorkspaceChannel;
  className?: string;
}) {
  if (isOmnichannelChannel(channel)) {
    return <OmnichannelChannelBadge channel={channel} className={className} />;
  }

  const style = FUTURE_CHANNEL_STYLES[channel];

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

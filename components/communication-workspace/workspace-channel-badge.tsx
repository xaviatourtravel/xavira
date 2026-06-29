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
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  },
  telegram: {
    label: "Telegram",
    className: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80",
  },
  website_chat: {
    label: "Website",
    className: "bg-violet-50 text-violet-800 ring-1 ring-violet-200/80",
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

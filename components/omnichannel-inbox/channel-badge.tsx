import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

const CHANNEL_STYLES: Record<
  OmnichannelChannel,
  { label: string; className: string }
> = {
  instagram: {
    label: "Instagram",
    className: "bg-fuchsia-100 text-fuchsia-800",
  },
  facebook: {
    label: "Facebook",
    className: "bg-blue-100 text-blue-800",
  },
  whatsapp: {
    label: "WhatsApp",
    className: "bg-emerald-100 text-emerald-800",
  },
};

export function OmnichannelChannelBadge({
  channel,
  className,
}: {
  channel: OmnichannelChannel;
  className?: string;
}) {
  const style = CHANNEL_STYLES[channel];

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

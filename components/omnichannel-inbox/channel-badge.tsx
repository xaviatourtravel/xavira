import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

const CHANNEL_STYLES: Record<
  OmnichannelChannel,
  { label: string; className: string }
> = {
  instagram: {
    label: "Instagram",
    className: "bg-pink-50 text-pink-700 ring-1 ring-pink-100",
  },
  facebook: {
    label: "Facebook",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  },
  whatsapp: {
    label: "WhatsApp",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
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
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

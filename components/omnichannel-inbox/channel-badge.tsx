import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

const CHANNEL_STYLES: Record<
  OmnichannelChannel,
  { label: string; className: string }
> = {
  instagram: {
    label: "Instagram",
    className: "bg-gradient-to-r from-fuchsia-100 to-pink-100 text-fuchsia-900 ring-1 ring-fuchsia-200/80",
  },
  facebook: {
    label: "Facebook",
    className: "bg-blue-50 text-blue-800 ring-1 ring-blue-200/80",
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
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

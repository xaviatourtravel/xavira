import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

const CHANNEL_STYLES: Record<
  OmnichannelChannel,
  { label: string; className: string }
> = {
  instagram: {
    label: "Instagram",
    className:
      "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200/80 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:ring-fuchsia-500/30",
  },
  facebook: {
    label: "Facebook",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-500/15 dark:text-slate-300",
  },
  whatsapp: {
    label: "WhatsApp",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
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

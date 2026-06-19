import type { OmnichannelConversationStatus } from "@/types/omnichannel-inbox";
import { formatOmnichannelConversationStatusLabel } from "@/lib/omnichannel-inbox/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OmnichannelConversationStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  interested: "bg-sky-100 text-sky-800",
  hot_lead: "bg-orange-100 text-orange-800",
  booking_process: "bg-violet-100 text-violet-800",
  paid: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-700",
};

export function OmnichannelStatusBadge({
  status,
  className,
}: {
  status: OmnichannelConversationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {formatOmnichannelConversationStatusLabel(status)}
    </span>
  );
}

import type { OmnichannelConversationStatus } from "@/types/omnichannel-inbox";
import { formatOmnichannelConversationStatusLabel } from "@/lib/omnichannel-inbox/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OmnichannelConversationStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  following_up: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  quotation_sent: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  waiting_dp: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  closed_lost: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
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

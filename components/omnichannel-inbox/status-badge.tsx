import type { OmnichannelConversationStatus } from "@/types/omnichannel-inbox";
import { formatOmnichannelConversationStatusLabel } from "@/lib/omnichannel-inbox/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OmnichannelConversationStatus, string> = {
  new: "bg-slate-100 text-slate-600",
  following_up: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  quotation_sent: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
  waiting_dp: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  closed_won: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  closed_lost: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-200",
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

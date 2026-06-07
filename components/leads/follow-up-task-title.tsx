import {
  getFollowUpTaskDisplayTitle,
  isAutomaticFollowUpTitle,
} from "@/lib/leads/follow-up-task-display";
import { cn } from "@/lib/utils";

type FollowUpTaskTitleProps = {
  title: string;
  className?: string;
  titleClassName?: string;
};

export function FollowUpTaskTitle({
  title,
  className,
  titleClassName,
}: FollowUpTaskTitleProps) {
  const isAuto = isAutomaticFollowUpTitle(title);
  const displayTitle = getFollowUpTaskDisplayTitle(title);

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {isAuto && (
        <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
          Auto
        </span>
      )}
      <span className={cn("min-w-0 truncate", titleClassName)}>{displayTitle}</span>
    </div>
  );
}

"use client";

import { Clock } from "lucide-react";

import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type TimelineEmptyStateProps = {
  className?: string;
};

export function TimelineEmptyState({ className }: TimelineEmptyStateProps) {
  const { ti } = useInboxTranslation();

  return (
    <div className={cn("flex flex-col items-start", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/20">
        <Clock className="h-5 w-5 text-muted-foreground/45" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        {ti("customerTimelineEmptyTitle")}
      </p>
      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
        {ti("customerTimelineEmptyDesc")}
      </p>
    </div>
  );
}

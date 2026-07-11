"use client";

import { NotebookPen } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type InternalNotesEmptyStateProps = {
  onAdd: () => void;
  className?: string;
};

export function InternalNotesEmptyState({
  onAdd,
  className,
}: InternalNotesEmptyStateProps) {
  const { ti } = useInboxTranslation();

  return (
    <div className={cn("flex flex-col items-start", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/20">
        <NotebookPen
          className="h-5 w-5 text-muted-foreground/45"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        {ti("internalNotesEmptyTitle")}
      </p>
      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
        {ti("internalNotesEmptyDesc")}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-4 h-9 rounded-full border-border/20 bg-background px-4 text-xs font-medium shadow-none hover:bg-muted/20",
        )}
      >
        {ti("internalNotesAddButton")}
      </button>
    </div>
  );
}

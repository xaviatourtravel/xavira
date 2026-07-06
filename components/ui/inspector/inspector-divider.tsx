import { cn } from "@/lib/utils";

export function InspectorDivider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("h-px bg-border/50 dark:bg-border/35", className)}
    />
  );
}

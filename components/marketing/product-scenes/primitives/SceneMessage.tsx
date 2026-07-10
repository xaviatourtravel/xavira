import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { SceneAvatar } from "@/components/marketing/product-scenes/primitives/SceneAvatar";
import { cn } from "@/lib/utils";

export function SceneMessage({
  direction,
  children,
  name,
  time,
  showAvatar = true,
  className,
}: {
  direction: "in" | "out";
  children: React.ReactNode;
  name?: string;
  time?: string;
  showAvatar?: boolean;
  className?: string;
}) {
  const isOut = direction === "out";

  return (
    <div className={cn("flex gap-2", isOut && "flex-row-reverse", className)}>
      {showAvatar && name && !isOut ? <SceneAvatar name={name} size="sm" /> : null}
      {!showAvatar && !isOut ? <span className="w-7 shrink-0" aria-hidden /> : null}
      <div className={cn("min-w-0 max-w-[85%]", isOut && "ml-auto")}>
        <div
          className={cn(
            "px-3 py-2",
            isOut ? sceneStyles.bubbleOut : sceneStyles.bubbleIn,
          )}
        >
          <p className={sceneStyles.body}>{children}</p>
        </div>
        {time ? <p className={cn(sceneStyles.meta, "mt-1", isOut && "text-right")}>{time}</p> : null}
      </div>
    </div>
  );
}

export function SceneTimelineItem({
  label,
  meta,
  active = false,
  last = false,
}: {
  label: string;
  meta?: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <li className="relative flex gap-2.5 pb-3 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-1 h-2 w-2 shrink-0 rounded-full",
            active ? "bg-[var(--marketing-primary)]" : "bg-[var(--marketing-border-strong)]",
          )}
          aria-hidden
        />
        {!last ? (
          <span className="mt-1 w-px flex-1 bg-[var(--marketing-border-default)]" aria-hidden />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn(sceneStyles.label, active && "font-semibold text-[var(--marketing-foreground)]")}>
          {label}
        </p>
        {meta ? <p className={sceneStyles.meta}>{meta}</p> : null}
      </div>
    </li>
  );
}

export function SceneMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn(sceneStyles.surfaceMuted, "px-2.5 py-2", className)}>
      <p className={sceneStyles.meta}>{label}</p>
      <p className={cn(sceneStyles.name, "mt-0.5")}>{value}</p>
    </div>
  );
}

export function SceneConnector({
  direction = "horizontal",
  className,
}: {
  direction?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 text-[var(--marketing-border-strong)]",
        direction === "horizontal" ? "text-base leading-none" : "mx-auto block h-4 w-px bg-[var(--marketing-border-default)]",
        className,
      )}
    >
      {direction === "horizontal" ? "→" : null}
    </span>
  );
}

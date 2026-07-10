import type { ReactNode } from "react";

import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { cn } from "@/lib/utils";

export function SceneWindow({
  children,
  className,
  label,
  decorative = true,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  decorative?: boolean;
  glow?: boolean;
}) {
  return (
    <div
      className={cn("relative w-full min-w-0", className)}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
    >
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-[2rem] marketing-dark-band-glow opacity-60 blur-3xl sm:-inset-6"
        />
      ) : null}
      <div className={cn(sceneStyles.frame, "relative overflow-hidden")}>{children}</div>
    </div>
  );
}

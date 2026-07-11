"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { m } from "framer-motion";

import { motionTransition } from "@/components/marketing/motion/motion-variants";
import { useMotionScene } from "@/components/marketing/motion/motion-scene-context";
import { marketingMotionDurations } from "@/components/marketing/motion/motion-tokens";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/**
 * Scene-internal layer — content is always visible before choreography runs.
 * On reduced motion or hero context, shows final state immediately.
 */
export function SceneMotionLayer({
  children,
  className,
  delay = 0,
  style,
  instant = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
  /** Skip in-view gate (hero product sequence) */
  instant?: boolean;
}) {
  const { active, reducedMotion } = useMotionScene();
  const [played, setPlayed] = useState(false);

  const shouldAnimate = (instant || active) && !reducedMotion;

  useEffect(() => {
    if (shouldAnimate) {
      setPlayed(true);
    }
  }, [shouldAnimate]);

  if (reducedMotion || !played) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      className={cn(className)}
      style={style}
      initial={{ opacity: 0.94, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition(marketingMotionDurations.fast, delay)}
    >
      {children}
    </m.div>
  );
}

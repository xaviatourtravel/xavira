"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";

import {
  getMotionViewport,
  motionTransition,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/components/marketing/motion/motion-variants";
import {
  marketingMotionDurations,
  marketingMotionStagger,
  type MotionViewportPreset,
} from "@/components/marketing/motion/motion-tokens";
import { cn } from "@/lib/utils";

export type MotionStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: keyof typeof marketingMotionStagger | number;
  delayChildren?: number;
  immediate?: boolean;
  viewport?: MotionViewportPreset;
};

export function MotionStagger({
  children,
  className,
  stagger = "standard",
  delayChildren = 0,
  immediate = false,
  viewport = "default",
}: MotionStaggerProps) {
  const reducedMotion = useReducedMotion();
  const staggerMs =
    typeof stagger === "number" ? stagger : marketingMotionStagger[stagger];

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants = staggerContainerVariants(staggerMs, delayChildren);
  const viewportOptions = getMotionViewport(viewport);

  if (immediate) {
    return (
      <m.div
        className={cn(className)}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {children}
      </m.div>
    );
  }

  return (
    <m.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOptions}
      variants={containerVariants}
    >
      {children}
    </m.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
  delay,
}: {
  children: ReactNode;
  className?: string;
  /** Optional per-item delay override in ms */
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const itemTransition = motionTransition(
    marketingMotionDurations.reveal,
    delay ?? 0,
  );

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div className={className} variants={staggerItemVariants} transition={itemTransition}>
      {children}
    </m.div>
  );
}

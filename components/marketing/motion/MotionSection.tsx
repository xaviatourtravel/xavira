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

export type MotionSectionGroupProps = {
  children: ReactNode;
  className?: string;
  minimal?: boolean;
  viewport?: MotionViewportPreset;
};

/** Groups eyebrow → heading → copy → visual with compact stagger */
export function MotionSectionGroup({
  children,
  className,
  minimal = false,
  viewport = "default",
}: MotionSectionGroupProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants = staggerContainerVariants(
    minimal ? marketingMotionStagger.compact : marketingMotionStagger.standard,
  );

  return (
    <m.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={getMotionViewport(viewport)}
      variants={containerVariants}
    >
      {children}
    </m.div>
  );
}

export function MotionSectionItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const itemTransition = motionTransition(marketingMotionDurations.reveal);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div className={className} variants={staggerItemVariants} transition={itemTransition}>
      {children}
    </m.div>
  );
}

"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";

import {
  getMotionViewport,
  motionTransition,
  revealLeftVariants,
  revealRightVariants,
  revealVariants,
} from "@/components/marketing/motion/motion-variants";
import {
  marketingMotionDurations,
  type MotionViewportPreset,
} from "@/components/marketing/motion/motion-tokens";
import { cn } from "@/lib/utils";

type MotionRevealDirection = "up" | "left" | "right";

export type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: MotionRevealDirection;
  immediate?: boolean;
  duration?: number;
  viewport?: MotionViewportPreset;
  as?: "div" | "section" | "article" | "li" | "span";
};

const directionMap = {
  up: revealVariants,
  left: revealLeftVariants,
  right: revealRightVariants,
} as const;

export function MotionReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  immediate = false,
  duration = marketingMotionDurations.reveal,
  viewport = "default",
  as = "div",
}: MotionRevealProps) {
  const reducedMotion = useReducedMotion();
  const Component = m[as];
  const variants = directionMap[direction];
  const viewportOptions = getMotionViewport(viewport);

  if (reducedMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const transition = motionTransition(duration, delay);

  if (immediate) {
    return (
      <Component
        className={cn(className)}
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={transition}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOptions}
      variants={variants}
      transition={transition}
    >
      {children}
    </Component>
  );
}

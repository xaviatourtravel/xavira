"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

import { MotionSceneContext } from "@/components/marketing/motion/motion-scene-context";
import { marketingMotionViewport } from "@/components/marketing/motion/motion-tokens";
import { cn } from "@/lib/utils";

export type MotionSceneProps = {
  children: ReactNode;
  className?: string;
  once?: boolean;
};

/** Provides in-view context for product scene choreography */
export function MotionScene({ children, className, once = true }: MotionSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, {
    once,
    amount: marketingMotionViewport.amountScene,
    margin: "0px 0px -8% 0px",
  });

  const active = reducedMotion ? true : inView;

  return (
    <MotionSceneContext.Provider value={{ active, reducedMotion: Boolean(reducedMotion) }}>
      <div ref={ref} className={cn(className)}>
        {children}
      </div>
    </MotionSceneContext.Provider>
  );
}

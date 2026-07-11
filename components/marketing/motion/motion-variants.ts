import type { Transition, Variants, ViewportOptions } from "framer-motion";

import {
  marketingMotionBlur,
  marketingMotionDistance,
  marketingMotionDurations,
  marketingMotionEasing,
  marketingMotionStagger,
  marketingMotionViewport,
  type MotionViewportPreset,
} from "@/components/marketing/motion/motion-tokens";

const VIEWPORT_MARGIN = {
  default: "0px 0px -72px 0px",
  large: "0px 0px -10% 0px",
  scene: "0px 0px -8% 0px",
} as const;

export function getMotionViewport(preset: MotionViewportPreset = "default"): ViewportOptions {
  switch (preset) {
    case "large":
      return {
        once: marketingMotionViewport.once,
        amount: marketingMotionViewport.amountLarge,
        margin: VIEWPORT_MARGIN.large,
      };
    case "small":
      return {
        once: marketingMotionViewport.once,
        amount: marketingMotionViewport.amountSmall,
        margin: VIEWPORT_MARGIN.default,
      };
    case "scene":
      return {
        once: marketingMotionViewport.once,
        amount: marketingMotionViewport.amountScene,
        margin: VIEWPORT_MARGIN.scene,
      };
    default:
      return {
        once: marketingMotionViewport.once,
        amount: marketingMotionViewport.amount,
        margin: VIEWPORT_MARGIN.default,
      };
  }
}
/** @deprecated Use getMotionViewport() */
export const motionViewport = getMotionViewport("default");

export function motionTransition(
  durationMs: number = marketingMotionDurations.reveal,
  delayMs = 0,
  ease: readonly [number, number, number, number] = marketingMotionEasing.emphasized,
): Transition {
  return {
    duration: durationMs / 1000,
    delay: delayMs / 1000,
    ease: [...ease],
  };
}

/** Calm scroll reveal — readable quickly; resolves fully on trigger */
export const revealVariants: Variants = {
  hidden: {
    opacity: 0.96,
    y: marketingMotionDistance.normal,
    filter: `blur(${marketingMotionBlur.reveal}px)`,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

export const revealLeftVariants: Variants = {
  hidden: {
    opacity: 0.96,
    x: -marketingMotionDistance.sceneHorizontal,
    y: marketingMotionDistance.micro,
    filter: `blur(${marketingMotionBlur.reveal}px)`,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
  },
};

export const revealRightVariants: Variants = {
  hidden: {
    opacity: 0.96,
    x: marketingMotionDistance.sceneHorizontal,
    y: marketingMotionDistance.micro,
    filter: `blur(${marketingMotionBlur.reveal}px)`,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
  },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0.96 },
  visible: { opacity: 1 },
};

/** Hero workspace — animates after mount; copy stays static */
export const heroSceneEnterVariants: Variants = {
  hidden: {
    opacity: 0.94,
    y: marketingMotionDistance.scene,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

export const calloutVariants: Variants = {
  hidden: { opacity: 0.9, y: marketingMotionDistance.micro },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainerVariants = (
  staggerMs: number = marketingMotionStagger.standard,
  delayChildrenMs = 0,
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerMs / 1000,
      delayChildren: delayChildrenMs / 1000,
    },
  },
});

export const staggerItemVariants: Variants = {
  hidden: revealVariants.hidden,
  visible: {
    ...revealVariants.visible,
    transition: motionTransition(marketingMotionDurations.reveal),
  },
};

export const mobileMenuVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const mobileOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

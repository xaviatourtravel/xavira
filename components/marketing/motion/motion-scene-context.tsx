"use client";

import { createContext, useContext } from "react";

export type MotionSceneContextValue = {
  /** Scene choreography should run */
  active: boolean;
  /** User prefers reduced motion */
  reducedMotion: boolean;
};

const defaultValue: MotionSceneContextValue = {
  active: false,
  reducedMotion: false,
};

export const MotionSceneContext = createContext<MotionSceneContextValue>(defaultValue);

export function useMotionScene() {
  return useContext(MotionSceneContext);
}

/** Hero loads above the fold — always active unless reduced motion */
export const HeroMotionContext = createContext<MotionSceneContextValue>({
  active: true,
  reducedMotion: false,
});

export function useHeroMotion() {
  return useContext(HeroMotionContext);
}

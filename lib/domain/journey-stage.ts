/** Canonical customer journey stage shared across passport, CRM, and inbox. */
export type JourneyStage =
  | "awareness"
  | "interest"
  | "planning"
  | "quotation"
  | "negotiation"
  | "dp"
  | "trip"
  | "review"
  | "repeat";

export type JourneyStageProgress = {
  stage: JourneyStage;
  reached: boolean;
  current: boolean;
};

export type CustomerJourney = {
  currentStage: JourneyStage;
  stages: JourneyStageProgress[];
};

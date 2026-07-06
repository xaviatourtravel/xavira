export type PlaygroundImprovementSuggestionSource =
  | "simulation"
  | "health"
  | "coverage";

export type PlaygroundImprovementSuggestion = {
  id: string;
  title: string;
  expectedImpact: string;
  expectedImpactValue: number;
  targetPage: string;
  buttonLabel: string;
  source: PlaygroundImprovementSuggestionSource;
};

export type PlaygroundImprovementSuggestionsView = {
  items: PlaygroundImprovementSuggestion[];
};

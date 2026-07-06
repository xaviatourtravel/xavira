import type { PlaygroundAiScore } from "@/modules/business-brain/types/playground-ai-score";

export type SimulatorChatMessage = {
  id: string;
  role: "customer" | "ai";
  text: string;
  aiScore?: PlaygroundAiScore;
};

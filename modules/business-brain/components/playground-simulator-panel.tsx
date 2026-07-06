"use client";

import { Loader2, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef } from "react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { DsTextarea } from "@/components/design-system/form-controls";
import { InspectorConversationBubble } from "@/modules/business-brain/components/inspector/inspector-primitives";
import { PlaygroundAiScoreCard } from "@/modules/business-brain/components/playground-ai-score-card";
import { PLAYGROUND_CONVERSATION_SCENARIOS } from "@/modules/business-brain/lib/playground-conversation-scenarios";
import type { SimulatorChatMessage } from "@/modules/business-brain/types/playground-simulator";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export type { SimulatorChatMessage };

export const SIMULATOR_SUGGESTED_QUESTIONS = [
  "Do you have a Japan package?",
  "How much is Umrah?",
  "Is the food halal?",
  "Can I travel with children?",
  "How do I pay?",
  "Can I get a refund?",
  "What documents are required?",
] as const;

type PlaygroundSimulatorPanelProps = {
  messages: SimulatorChatMessage[];
  draftMessage: string;
  isRunning: boolean;
  llmConfigured: boolean;
  errorMessage: string | null;
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
  onSuggestedQuestion: (question: string) => void;
  onScenario: (scenarioId: string) => void;
  onResetConversation: () => void;
};

export function PlaygroundSimulatorPanel({
  messages,
  draftMessage,
  isRunning,
  llmConfigured,
  errorMessage,
  onDraftMessageChange,
  onSend,
  onSuggestedQuestion,
  onScenario,
  onResetConversation,
}: PlaygroundSimulatorPanelProps) {
  const { tStrict } = useTranslation();
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRunning]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isRunning && draftMessage.trim() && llmConfigured) {
        onSend();
      }
    }
  };

  return (
    <DsCard
      title={tStrict("testAi.customerSimulator")}
      description={tStrict("testAi.customerSimulatorDescription")}
      className="flex min-h-[520px] flex-col"
    >
      <div className="mb-4 flex justify-end">
        <DsButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetConversation}
          disabled={isRunning || (messages.length === 0 && !errorMessage)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {tStrict("testAi.resetConversation")}
        </DsButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="min-h-[280px] flex-1 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4">
          {messages.length === 0 && !isRunning ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tStrict("testAi.startConversation")}
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <InspectorConversationBubble role={message.role}>
                    {message.text}
                  </InspectorConversationBubble>
                  {message.role === "ai" && message.aiScore ? (
                    <PlaygroundAiScoreCard score={message.aiScore} />
                  ) : null}
                </div>
              ))}
              {isRunning ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {tStrict("testAi.aiThinking")}
                  </div>
                </div>
              ) : null}
              <div ref={conversationEndRef} />
            </div>
          )}
        </div>

        <div className="w-full min-w-0 space-y-3">
          <DsTextarea
            value={draftMessage}
            onChange={(event) => onDraftMessageChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tStrict("testAi.askPlaceholder")}
            rows={2}
            disabled={!llmConfigured || isRunning}
            className="resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              {tStrict("testAi.exampleHint")}
            </p>
            <DsButton
              type="button"
              onClick={onSend}
              disabled={!llmConfigured || isRunning || !draftMessage.trim()}
              className="shrink-0"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tStrict("testAi.sending")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {tStrict("testAi.send")}
                </>
              )}
            </DsButton>
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <div className="w-full min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tStrict("testAi.conversationScenarios")}
            </p>
            <div className="flex w-full min-w-0 flex-wrap gap-2">
              {PLAYGROUND_CONVERSATION_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onScenario(scenario.id)}
                  disabled={!llmConfigured || isRunning}
                  className={cn(
                    "max-w-full rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground transition-colors",
                    "hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tStrict("testAi.suggestedQuestions")}
            </p>
            <div className="flex w-full min-w-0 flex-wrap gap-2">
              {SIMULATOR_SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onSuggestedQuestion(question)}
                  disabled={!llmConfigured || isRunning}
                  className={cn(
                    "max-w-full rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors",
                    "hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DsCard>
  );
}

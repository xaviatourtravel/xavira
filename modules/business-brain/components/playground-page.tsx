"use client";

import { useCallback, useState } from "react";

import { saveBrainTestSessionAction } from "@/modules/business-brain/actions/brain-test-session-actions";
import {
  resetPlaygroundConversationAction,
  runPlaygroundTestAction,
} from "@/modules/business-brain/actions/playground-actions";
import {
  BusinessBrainContentShell,
} from "@/modules/business-brain/components/business-brain-content-shell";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import { PlaygroundInspector } from "@/modules/business-brain/components/inspector/playground-inspector";
import { PlaygroundSavedTestsSidebar } from "@/modules/business-brain/components/playground-saved-tests-sidebar";
import { PlaygroundSimulatorPanel } from "@/modules/business-brain/components/playground-simulator-panel";
import { getPlaygroundConversationScenario } from "@/modules/business-brain/lib/playground-conversation-scenarios";
import type { BrainTestSessionRecord } from "@/modules/business-brain/types/brain-test-session";
import type {
  PlaygroundAvailableContext,
  PlaygroundSavedExample,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import type { SimulatorChatMessage } from "@/modules/business-brain/types/playground-simulator";
import type { BusinessBrainHealth } from "@/modules/business-brain/types/business-brain-health";
import type { KnowledgeCoverageResult } from "@/modules/business-brain/types/knowledge-coverage";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type PlaygroundPageClientProps = {
  initialAvailableContext: PlaygroundAvailableContext;
  initialSavedExamples: PlaygroundSavedExample[];
  initialSavedTestSessions: BrainTestSessionRecord[];
  initialActiveSessionId: string | null;
  initialActiveSession: {
    id: string;
    conversation: SimulatorChatMessage[];
    inspector: PlaygroundTestResult | null;
  } | null;
  canEdit: boolean;
  llmConfigured: boolean;
  health: BusinessBrainHealth;
  knowledgeCoverage: KnowledgeCoverageResult;
};

type MobilePanel = "simulator" | "inspector" | "saved";

type TurnResult =
  | {
      ok: true;
      messages: SimulatorChatMessage[];
      result: PlaygroundTestResult;
    }
  | {
      ok: false;
      messages: SimulatorChatMessage[];
      error: string;
    };

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toConversationHistory(messages: SimulatorChatMessage[]): WhatsAppConversationTurn[] {
  return messages.map((message) => ({
    sender: message.role === "customer" ? "customer" : "ai",
    text: message.text,
  }));
}

export function PlaygroundPageClient({
  llmConfigured,
  health,
  knowledgeCoverage,
  initialSavedTestSessions,
  initialActiveSessionId,
  initialActiveSession,
}: PlaygroundPageClientProps) {
  const { tStrict } = useTranslation();
  const [messages, setMessages] = useState<SimulatorChatMessage[]>(
    initialActiveSession?.conversation ?? [],
  );
  const [draftMessage, setDraftMessage] = useState("");
  const [testResult, setTestResult] = useState<PlaygroundTestResult | null>(
    initialActiveSession?.inspector ?? null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(
    initialActiveSession?.conversation.length ? "inspector" : "simulator",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSessions, setSavedSessions] = useState(initialSavedTestSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialActiveSession?.id ?? initialActiveSessionId,
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const hasAiReply = messages.some((message) => message.role === "ai");
  const canSave = hasAiReply && testResult !== null && !isRunning && !isSaving;

  const executeTurn = useCallback(
    async (
      customerMessage: string,
      priorMessages: SimulatorChatMessage[],
    ): Promise<TurnResult> => {
      const trimmedMessage = customerMessage.trim();
      if (!trimmedMessage) {
        return {
          ok: false,
          messages: priorMessages,
          error: tStrict("testAi.customerMessageRequired"),
        };
      }

      const customerEntry: SimulatorChatMessage = {
        id: createMessageId(),
        role: "customer",
        text: trimmedMessage,
      };

      const withCustomer = [...priorMessages, customerEntry];
      setMessages(withCustomer);

      const response = await runPlaygroundTestAction({
        customerMessage: trimmedMessage,
        conversationHistory: toConversationHistory(priorMessages),
        sessionId: activeSessionId,
      });

      if (!response.ok || !response.result) {
        return {
          ok: false,
          messages: withCustomer,
          error: response.ok
            ? tStrict("testAi.aiPreviewFailed")
            : (response.error ?? tStrict("testAi.aiPreviewFailed")),
        };
      }

      const aiEntry: SimulatorChatMessage = {
        id: createMessageId(),
        role: "ai",
        text: response.result.preview.aiReply,
        aiScore: response.result.aiScore,
      };

      if ("sessionId" in response.result && response.result.sessionId) {
        setActiveSessionId(response.result.sessionId);
      }

      const fullMessages = [...withCustomer, aiEntry];
      setMessages(fullMessages);
      setTestResult(response.result);

      return {
        ok: true,
        messages: fullMessages,
        result: response.result,
      };
    },
    [tStrict, activeSessionId],
  );

  const runSingleTurn = useCallback(
    async (customerMessage: string, priorMessages: SimulatorChatMessage[]) => {
      if (!llmConfigured) {
        setErrorMessage(tStrict("testAi.llmNotConfigured"));
        return;
      }

      setActiveSessionId(null);
      setErrorMessage(null);
      setDraftMessage("");
      setMobilePanel("simulator");
      setIsRunning(true);

      const outcome = await executeTurn(customerMessage, priorMessages);

      setIsRunning(false);

      if (!outcome.ok) {
        setErrorMessage(outcome.error);
        setMessages(outcome.messages);
        return;
      }

      setMobilePanel("inspector");
    },
    [executeTurn, llmConfigured, tStrict],
  );

  const handleSend = () => {
    void runSingleTurn(draftMessage, messages);
  };

  const handleSuggestedQuestion = (question: string) => {
    setDraftMessage(question);
    void runSingleTurn(question, messages);
  };

  const handleScenario = useCallback(
    async (scenarioId: string) => {
      if (!llmConfigured || isRunning) {
        if (!llmConfigured) {
          setErrorMessage(tStrict("testAi.llmNotConfigured"));
        }
        return;
      }

      const scenario = getPlaygroundConversationScenario(scenarioId);
      if (!scenario) {
        return;
      }

      setActiveSessionId(null);
      setActiveScenarioId(scenarioId);
      setErrorMessage(null);
      setDraftMessage("");
      void resetPlaygroundConversationAction();
      setMessages([]);
      setTestResult(null);
      setMobilePanel("simulator");
      setIsRunning(true);

      let currentMessages: SimulatorChatMessage[] = [];

      for (const customerMessage of scenario.messages) {
        const outcome = await executeTurn(customerMessage, currentMessages);

        if (!outcome.ok) {
          setErrorMessage(outcome.error);
          setMessages(outcome.messages);
          setIsRunning(false);
          return;
        }

        currentMessages = outcome.messages;
      }

      setIsRunning(false);
      setMobilePanel("inspector");
    },
    [executeTurn, isRunning, llmConfigured, tStrict],
  );

  const handleResetConversation = () => {
    if (isRunning) {
      return;
    }

    void resetPlaygroundConversationAction(activeSessionId ?? undefined);
    setMessages([]);
    setTestResult(null);
    setDraftMessage("");
    setErrorMessage(null);
    setActiveSessionId(null);
    setActiveScenarioId(null);
    setMobilePanel("simulator");
  };

  const handleSaveTest = async () => {
    if (!canSave || !testResult) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const result = await saveBrainTestSessionAction({
      scenario: activeScenarioId,
      conversation: messages,
      inspector: testResult,
      score: testResult.aiScore.breakdown.overall,
    });

    setIsSaving(false);

    if (!result.ok || !result.session) {
      setErrorMessage(result.ok ? tStrict("testAi.saveFailed") : result.error);
      return;
    }

    setSavedSessions((current) => [result.session!, ...current]);
    setActiveSessionId(result.session.id);
  };

  const handleReplay = (session: BrainTestSessionRecord) => {
    if (isRunning) {
      return;
    }

    setMessages(session.conversation);
    setTestResult(session.inspector);
    setActiveScenarioId(session.scenario);
    setActiveSessionId(session.id);
    setDraftMessage("");
    setErrorMessage(null);
    setMobilePanel("inspector");
  };

  const mobileTabLabels: Record<MobilePanel, string> = {
    simulator: tStrict("testAi.simulator"),
    inspector: tStrict("testAi.inspector"),
    saved: tStrict("testAi.savedTests"),
  };

  return (
    <BusinessBrainContentShell>
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(tStrict, "playground")}
        iconSlug="playground"
        description={translateBusinessBrainSectionDescription(tStrict, "playground")}
      />

      {!llmConfigured ? (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {tStrict("testAi.llmNotConfigured")}
        </div>
      ) : null}

      <div className="flex gap-2 xl:hidden">
        {(["simulator", "inspector", "saved"] as const).map((panel) => (
          <button
            key={panel}
            type="button"
            onClick={() => setMobilePanel(panel)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              mobilePanel === panel
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {mobileTabLabels[panel]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main
          className={cn(
            "min-w-0 space-y-3",
            mobilePanel !== "simulator" && mobilePanel !== "saved" && "hidden xl:block",
          )}
        >
          <div className={cn(mobilePanel === "saved" && "hidden xl:block")}>
            <PlaygroundSimulatorPanel
              messages={messages}
              draftMessage={draftMessage}
              isRunning={isRunning}
              llmConfigured={llmConfigured}
              errorMessage={errorMessage}
              onDraftMessageChange={setDraftMessage}
              onSend={handleSend}
              onSuggestedQuestion={handleSuggestedQuestion}
              onScenario={handleScenario}
              onResetConversation={handleResetConversation}
            />
          </div>

          <div className={cn(mobilePanel === "simulator" && "hidden xl:block", "xl:block")}>
            <PlaygroundSavedTestsSidebar
              compact
              sessions={savedSessions}
              activeSessionId={activeSessionId}
              isRunning={isRunning}
              canSave={canSave}
              isSaving={isSaving}
              onSaveTest={() => void handleSaveTest()}
              onReplay={handleReplay}
              onSessionsChange={setSavedSessions}
            />
          </div>
        </main>

        <aside
          className={cn(
            "w-full shrink-0 xl:sticky xl:top-4 xl:w-[320px]",
            mobilePanel !== "inspector" && "hidden xl:block",
          )}
        >
          <PlaygroundInspector
            testResult={testResult}
            health={health}
            knowledgeCoverage={knowledgeCoverage}
          />
        </aside>
      </div>
    </BusinessBrainContentShell>
  );
}

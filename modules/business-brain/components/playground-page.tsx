"use client";

import { useEffect, useState, useTransition } from "react";

import {
  runPlaygroundTestAction,
  savePlaygroundExampleAction,
} from "@/modules/business-brain/actions/playground-actions";
import { PlaygroundContextInspector } from "@/modules/business-brain/components/playground-context-inspector";
import { PlaygroundMemoryTestPanel } from "@/modules/business-brain/components/playground-memory-test-panel";
import {
  DEFAULT_PLAYGROUND_CONTEXT,
  PlaygroundTestInputPanel,
} from "@/modules/business-brain/components/playground-test-input";
import { DEFAULT_PLAYGROUND_MEMORY_TEST } from "@/modules/ai/types/memory";
import { PlaygroundPreviewPanel } from "@/modules/business-brain/components/playground-preview-panel";
import type {
  PlaygroundAvailableContext,
  PlaygroundCustomerContext,
  PlaygroundFeedbackStatus,
  PlaygroundMemoryTestInput,
  PlaygroundPreviewResult,
  PlaygroundSavedExample,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import { cn } from "@/lib/utils";

type PlaygroundPageClientProps = {
  initialAvailableContext: PlaygroundAvailableContext;
  initialSavedExamples: PlaygroundSavedExample[];
  canEdit: boolean;
  llmConfigured: boolean;
};

type MobilePanel = "input" | "preview" | "context";

export function PlaygroundPageClient({
  initialAvailableContext,
  initialSavedExamples,
  canEdit,
  llmConfigured,
}: PlaygroundPageClientProps) {
  const [availableContext] = useState(initialAvailableContext);
  const [savedExamples, setSavedExamples] = useState(initialSavedExamples);
  const [customerMessage, setCustomerMessage] = useState(
    "Halo kak, saya mau tanya paket umrah bulan September untuk 4 orang",
  );
  const [context, setContext] = useState<PlaygroundCustomerContext>(DEFAULT_PLAYGROUND_CONTEXT);
  const [memoryTest, setMemoryTest] = useState<PlaygroundMemoryTestInput>(
    DEFAULT_PLAYGROUND_MEMORY_TEST,
  );
  const [testResult, setTestResult] = useState<PlaygroundTestResult | null>(null);
  const [editedReply, setEditedReply] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<PlaygroundFeedbackStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("input");
  const [isRunning, startRunTransition] = useTransition();
  const [isSavingExample, startSaveTransition] = useTransition();

  useEffect(() => {
    if (testResult?.preview.aiReply) {
      setEditedReply(testResult.preview.aiReply);
    }
  }, [testResult]);

  const handleRunTest = () => {
    if (!llmConfigured) {
      setErrorMessage("LLM is not configured. Add OPENAI_API_KEY to enable AI preview.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setFeedbackStatus("idle");
    setIsEditing(false);
    setTestResult(null);

    startRunTransition(async () => {
      const result = await runPlaygroundTestAction({
        customerMessage,
        context,
        memoryTest,
      });

      if (!result.ok || !result.result) {
        setErrorMessage(
          result.ok
            ? "AI preview failed. Please try again."
            : result.error ?? "AI preview failed. Please try again.",
        );
        setMobilePanel("preview");
        return;
      }

      setTestResult(result.result);
      setEditedReply(result.result.preview.aiReply);
      setMobilePanel("preview");
    });
  };

  const handleApprove = () => {
    setFeedbackStatus("approved");
    setStatusMessage(null);
  };

  const handleReject = () => {
    setFeedbackStatus("rejected");
    setStatusMessage(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFeedbackStatus("edited");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (testResult) {
      setEditedReply(testResult.preview.aiReply);
    }
  };

  const handleSaveExample = () => {
    if (!testResult) return;

    startSaveTransition(async () => {
      const result = await savePlaygroundExampleAction({
        customerMessage,
        aiReply: editedReply || testResult.preview.aiReply,
      });

      if (!result.ok || !result.example) {
        setStatusMessage(result.ok ? "Save failed." : result.error);
        return;
      }

      setSavedExamples((current) => [result.example, ...current].slice(0, 10));
      setStatusMessage("Example saved locally (no learning applied yet).");
    });
  };

  const preview: PlaygroundPreviewResult | null = testResult?.preview ?? null;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground md:text-2xl">Playground</h2>
        <p className="text-sm text-muted-foreground">
          Test how AI would answer using your draft Business Brain configuration.
        </p>
      </div>

      {!llmConfigured ? (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          LLM is not configured. Add OPENAI_API_KEY to enable AI preview.
        </div>
      ) : null}

      <div className="flex gap-2 lg:hidden">
        {(["input", "preview", "context"] as const).map((panel) => (
          <button
            key={panel}
            type="button"
            onClick={() => setMobilePanel(panel)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
              mobilePanel === panel
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {panel === "input" ? "Input" : panel === "preview" ? "Preview" : "Context"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,300px)]">
        <div className={cn(mobilePanel === "input" ? "block" : "hidden xl:block")}>
          <div className="space-y-4">
            <PlaygroundTestInputPanel
              customerMessage={customerMessage}
              context={context}
              canEdit={canEdit}
              isRunning={isRunning}
              llmConfigured={llmConfigured}
              errorMessage={errorMessage}
              onCustomerMessageChange={setCustomerMessage}
              onContextChange={setContext}
              onRunTest={handleRunTest}
            />
            <PlaygroundMemoryTestPanel
              memoryTest={memoryTest}
              canEdit={canEdit}
              onMemoryTestChange={setMemoryTest}
            />
          </div>
        </div>

        <div className={cn(mobilePanel === "preview" ? "block" : "hidden xl:block")}>
          <PlaygroundPreviewPanel
            preview={preview}
            editedReply={editedReply}
            isEditing={isEditing}
            isRunning={isRunning}
            feedbackStatus={feedbackStatus}
            canEdit={canEdit}
            isSavingExample={isSavingExample}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            onEditedReplyChange={setEditedReply}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onReject={handleReject}
            onSaveExample={handleSaveExample}
          />
        </div>

        <div
          className={cn(
            "space-y-4",
            mobilePanel === "context" ? "block" : "hidden xl:block",
          )}
        >
          <PlaygroundContextInspector
            context={testResult?.contextUsed ?? availableContext}
            mode={testResult ? "used" : "available"}
            retrievalSummary={testResult?.retrievalSummary}
            customerMemoryUsed={testResult?.customerMemoryUsed}
            leadQualification={testResult?.leadQualification}
          />
        </div>
      </div>

      {savedExamples.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Saved Examples (session)</h3>
          <ul className="mt-3 space-y-2">
            {savedExamples.slice(0, 3).map((example) => (
              <li
                key={example.id}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">{example.customerMessage}</span>
                <span className="mx-2">→</span>
                <span>
                  {example.aiReply.slice(0, 120)}
                  {example.aiReply.length > 120 ? "…" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { Loader2, Pencil, Play, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import {
  deleteBrainTestSessionAction,
  renameBrainTestSessionAction,
} from "@/modules/business-brain/actions/brain-test-session-actions";
import type { BrainTestSessionRecord } from "@/modules/business-brain/types/brain-test-session";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type PlaygroundSavedTestsSidebarProps = {
  sessions: BrainTestSessionRecord[];
  activeSessionId: string | null;
  isRunning: boolean;
  canSave: boolean;
  isSaving: boolean;
  onSaveTest: () => void;
  onReplay: (session: BrainTestSessionRecord) => void;
  onSessionsChange: (sessions: BrainTestSessionRecord[]) => void;
  compact?: boolean;
};

export function PlaygroundSavedTestsSidebar({
  sessions,
  activeSessionId,
  isRunning,
  canSave,
  isSaving,
  onSaveTest,
  onReplay,
  onSessionsChange,
  compact = false,
}: PlaygroundSavedTestsSidebarProps) {
  const { tStrict } = useTranslation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, startMutating] = useTransition();

  const handleStartRename = (session: BrainTestSessionRecord) => {
    setRenamingId(session.id);
    setRenameDraft(session.title);
    setActionError(null);
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameDraft("");
  };

  const handleSubmitRename = (sessionId: string) => {
    const title = renameDraft.trim();
    if (!title) {
      return;
    }

    startMutating(async () => {
      const result = await renameBrainTestSessionAction({ id: sessionId, title });
      if (!result.ok || !result.session) {
        setActionError(result.ok ? tStrict("testAi.renameFailed") : result.error);
        return;
      }

      onSessionsChange(
        sessions.map((session) => (session.id === sessionId ? result.session! : session)),
      );
      setRenamingId(null);
      setRenameDraft("");
      setActionError(null);
    });
  };

  const handleDelete = (sessionId: string) => {
    if (!window.confirm(tStrict("testAi.deleteConfirm"))) {
      return;
    }

    startMutating(async () => {
      const result = await deleteBrainTestSessionAction({ id: sessionId });
      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      onSessionsChange(sessions.filter((session) => session.id !== sessionId));
      setActionError(null);
    });
  };

  return (
    <DsCard
      title={tStrict("testAi.savedTests")}
      className={cn(!compact && "flex h-full flex-col")}
    >
      <div className={cn("mb-4", compact && "mb-3")}>
        <DsButton
          type="button"
          className={cn(compact ? "w-auto" : "w-full")}
          size={compact ? "sm" : undefined}
          onClick={onSaveTest}
          disabled={!canSave || isRunning || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tStrict("testAi.saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {tStrict("testAi.saveTest")}
            </>
          )}
        </DsButton>
      </div>

      {actionError ? <p className="mb-3 text-xs text-destructive">{actionError}</p> : null}

      <div className={cn("space-y-2", !compact && "min-h-0 flex-1 overflow-y-auto")}>
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center">
            <p className="text-sm font-medium text-foreground">
              {tStrict("testAi.noSavedTests")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tStrict("testAi.noSavedTestsHint")}
            </p>
          </div>
        ) : (
          <div className={cn(compact ? "grid gap-2 sm:grid-cols-2" : "space-y-2")}>
            {sessions.map((session) => (
              <SavedTestItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                isRenaming={renamingId === session.id}
                renameDraft={renameDraft}
                isRunning={isRunning}
                isMutating={isMutating}
                compact={compact}
                onRenameDraftChange={setRenameDraft}
                onStartRename={() => handleStartRename(session)}
                onCancelRename={handleCancelRename}
                onSubmitRename={() => handleSubmitRename(session.id)}
                onReplay={() => onReplay(session)}
                onDelete={() => handleDelete(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DsCard>
  );
}

function SavedTestItem({
  session,
  isActive,
  isRenaming,
  renameDraft,
  isRunning,
  isMutating,
  compact,
  onRenameDraftChange,
  onStartRename,
  onCancelRename,
  onSubmitRename,
  onReplay,
  onDelete,
}: {
  session: BrainTestSessionRecord;
  isActive: boolean;
  isRenaming: boolean;
  renameDraft: string;
  isRunning: boolean;
  isMutating: boolean;
  compact: boolean;
  onRenameDraftChange: (value: string) => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSubmitRename: () => void;
  onReplay: () => void;
  onDelete: () => void;
}) {
  const { tStrict } = useTranslation();
  const relativeTime = (() => {
    const date = new Date(session.createdAt);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return tStrict("testAi.justNow");
    if (diffMinutes < 60) {
      return formatTranslation(tStrict("testAi.minutesAgo"), { count: diffMinutes });
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return formatTranslation(tStrict("testAi.hoursAgo"), { count: diffHours });
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return formatTranslation(tStrict("testAi.daysAgo"), { count: diffDays });
    }

    return date.toLocaleDateString();
  })();

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3 transition-colors",
        isActive ? "border-primary/40 bg-primary/5" : "border-border bg-background",
        compact && "py-2.5",
      )}
    >
      {isRenaming ? (
        <div className="space-y-2">
          <input
            value={renameDraft}
            onChange={(event) => onRenameDraftChange(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmitRename();
              }
              if (event.key === "Escape") {
                onCancelRename();
              }
            }}
          />
          <div className="flex gap-2">
            <DsButton
              type="button"
              size="sm"
              className="flex-1"
              disabled={isMutating || !renameDraft.trim()}
              onClick={onSubmitRename}
            >
              {tStrict("testAi.save")}
            </DsButton>
            <DsButton
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onCancelRename}
            >
              {tStrict("testAi.cancel")}
            </DsButton>
          </div>
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{session.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tStrict("testAi.score")} {Math.round(session.score)}% · {relativeTime}
            </p>
          </div>

          <div className={cn("mt-3 flex flex-wrap gap-2", compact && "mt-2")}>
            <DsButton
              type="button"
              size="sm"
              variant="outline"
              disabled={isRunning || isMutating}
              onClick={onReplay}
            >
              <Play className="h-3.5 w-3.5" />
              {tStrict("testAi.replay")}
            </DsButton>
            <DsButton
              type="button"
              size="sm"
              variant="outline"
              disabled={isRunning || isMutating}
              onClick={onStartRename}
            >
              <Pencil className="h-3.5 w-3.5" />
              {tStrict("testAi.rename")}
            </DsButton>
            <DsButton
              type="button"
              size="sm"
              variant="outline"
              disabled={isRunning || isMutating}
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {tStrict("testAi.delete")}
            </DsButton>
          </div>
        </>
      )}
    </div>
  );
}

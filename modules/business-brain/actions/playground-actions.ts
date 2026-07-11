"use server";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  getAvailableContext,
  isPlaygroundLlmConfigured,
  listSavedExamples,
  loadActivePlaygroundSession,
  PlaygroundLlmFailedError,
  PlaygroundLlmNotConfiguredError,
  resetPlaygroundConversation,
  runTest,
  saveExample,
} from "@/modules/business-brain/services/business-brain-playground-service";
import { getBrainTestSessions } from "@/modules/business-brain/services/brain-test-session-service";
import type { PlaygroundTestResult } from "@/modules/business-brain/types/playground";

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadPlaygroundAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const [activeSession, result] = await Promise.all([
    loadActivePlaygroundSession(organizationId, profile.id, null).catch(() => null),
    (async () => {
      const [availableContext, savedExamples, savedTestSessions] = await Promise.all([
        getAvailableContext(organizationId),
        Promise.resolve(listSavedExamples(organizationId)),
        getBrainTestSessions(organizationId),
      ]);
      return { availableContext, savedExamples, savedTestSessions };
    })(),
  ]);

  const activeInspector =
    activeSession?.inspector &&
    typeof activeSession.inspector === "object" &&
    "preview" in activeSession.inspector
      ? (activeSession.inspector as PlaygroundTestResult)
      : null;

  return {
    availableContext: result.availableContext,
    savedExamples: result.savedExamples,
    savedTestSessions: result.savedTestSessions,
    activeSessionId: activeSession?.id ?? null,
    activeSession:
      activeSession && activeSession.conversation.length > 0
        ? {
            id: activeSession.id,
            conversation: activeSession.conversation,
            inspector: activeInspector,
          }
        : null,
    canEdit: true,
    llmConfigured: isPlaygroundLlmConfigured(),
  };
}

export async function runPlaygroundTestAction(input: unknown) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);

  try {
    const result = await runTest(organizationId, profile.id, input);
    return { ok: true as const, result };
  } catch (error) {
    if (error instanceof PlaygroundLlmNotConfiguredError) {
      return {
        ok: false as const,
        code: "llm_not_configured" as const,
        error: error.message,
      };
    }

    if (error instanceof PlaygroundLlmFailedError) {
      return {
        ok: false as const,
        code: "llm_failed" as const,
        error: error.message,
      };
    }

    return {
      ok: false as const,
      code: "unknown" as const,
      error: error instanceof Error ? error.message : "Failed to run playground test.",
    };
  }
}

export async function resetPlaygroundConversationAction(sessionId?: string) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  await resetPlaygroundConversation(organizationId, profile.id, sessionId);
  return { ok: true as const };
}

export async function savePlaygroundExampleAction(input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const organizationId = requireOrgId(profile);

  try {
    const example = await saveExample(organizationId, input);
    return { ok: true as const, example };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to save example.",
    };
  }
}

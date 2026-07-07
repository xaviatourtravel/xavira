import { siteConfig } from "@/config/site";

import type { AiRuntimeLocale } from "@/modules/ai/context/runtime/build-runtime-context";
import { DEFAULT_AI_TIMEZONE } from "@/modules/ai/runtime/build-runtime-context";

export type BuildWorkspaceContextInput = {
  workspaceName?: string | null;
  language?: AiRuntimeLocale | null;
  currency?: string | null;
  timezone?: string | null;
};

export type WorkspaceContext = {
  workspaceName: string;
  language: AiRuntimeLocale;
  currency: string;
  timezone: string;
};

export function buildWorkspaceContext(
  input?: BuildWorkspaceContextInput,
): WorkspaceContext {
  return {
    workspaceName: input?.workspaceName?.trim() || "Workspace",
    language: input?.language === "en" ? "en" : "id",
    currency: input?.currency?.trim() || siteConfig.defaultCurrency,
    timezone: input?.timezone?.trim() || DEFAULT_AI_TIMEZONE,
  };
}

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { requireOrganizationProfile } from "@/lib/auth/session";
import {
  requireOpenAiApiKey,
  resolveMeetingModelConfig,
} from "@/modules/ai-team-member/lib/meeting-config";
import { isBrainId } from "@/modules/ai-team-member/lib/meeting-domain";
import { hashForDiagnostics } from "@/modules/ai-team-member/lib/meeting-realtime";
import {
  executeRealtimeTool,
  mapToolNameToUiStatus,
  realtimeToolExecuteBodySchema,
  type RealtimeToolReasonClient,
  type RealtimeToolWebClient,
} from "@/modules/ai-team-member/lib/meeting-realtime-tools";
import { createEmptyApprovedMemoryRepository } from "@/modules/ai-team-member/lib/meeting-memory-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated server-mediated Realtime tool execution.
 *
 * Official WebRTC sideband (long-lived server WebSocket on call_id) is not used
 * as the primary path because Next.js/Vercel serverless cannot reliably hold that
 * connection for the life of a call. Privileged tools still never run in the browser:
 * the client only relays function_call events here and returns sanitized outputs.
 */
export async function POST(request: Request) {
  let organizationId = "";
  let userId = "";
  const requestId = crypto.randomUUID();

  try {
    const { user, profile } = await requireOrganizationProfile();
    organizationId = profile.organization_id;
    userId = user.id;
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rate = checkAiRateLimit({
    organizationId,
    userId,
    route: "realtime-tools",
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: rate.message, code: rate.code },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const parsed = realtimeToolExecuteBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid realtime tool payload.", code: "validation" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Never trust a browser-supplied organization id.
  if (!isBrainId(parsed.data.brainId)) {
    return NextResponse.json(
      { error: "Brain tidak valid.", code: "validation" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const apiKeyResult = requireOpenAiApiKey();
  if (!apiKeyResult.ok) {
    return NextResponse.json(
      { error: apiKeyResult.message, code: apiKeyResult.code },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const configResult = resolveMeetingModelConfig();
  if (!configResult.ok) {
    return NextResponse.json(
      { error: configResult.message, code: configResult.code },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const openai = new OpenAI({ apiKey: apiKeyResult.apiKey });
  const startedAt = Date.now();
  const result = await executeRealtimeTool({
    organizationId,
    brainId: parsed.data.brainId,
    name: parsed.data.name,
    callId: parsed.data.callId,
    arguments: parsed.data.arguments,
    config: configResult.config,
    memoryRepository: createEmptyApprovedMemoryRepository(),
    webClient: openai as unknown as RealtimeToolWebClient,
    reasonClient: openai as unknown as RealtimeToolReasonClient,
  });

  console.info("[ai-team-member] realtime tool executed", {
    requestId,
    organizationHash: hashForDiagnostics(organizationId),
    brainHash: hashForDiagnostics(parsed.data.brainId),
    toolName: result.toolName,
    ok: result.ok,
    errorCode: result.errorCode ?? null,
    latencyMs: Date.now() - startedAt,
    sourceCount: result.sources.length,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      output: result.output,
      uiStatus: result.uiStatus || mapToolNameToUiStatus(parsed.data.name),
      sources: result.sources.map((source) => ({
        title: source.title,
        url: source.url,
        category: source.category,
        kind: source.kind,
      })),
      toolName: result.toolName,
      errorCode: result.errorCode ?? null,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

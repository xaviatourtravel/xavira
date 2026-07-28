import OpenAI from "openai";
import { NextResponse } from "next/server";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { requireOrganizationProfile } from "@/lib/auth/session";
import {
  requireOpenAiApiKey,
  resolveMeetingModelConfig,
} from "@/modules/ai-team-member/lib/meeting-config";
import {
  assertNoPermanentApiKeyInPayload,
  createRealtimeClientSecret,
  hashForDiagnostics,
  realtimeSessionBodySchema,
  toClientRealtimeSessionPayload,
  type RealtimeClientSecretsClient,
} from "@/modules/ai-team-member/lib/meeting-realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    route: "realtime-session",
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

  const parsed = realtimeSessionBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid realtime session payload.", code: "validation" },
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
  const client = openai as unknown as RealtimeClientSecretsClient;
  const result = await createRealtimeClientSecret({
    client,
    organizationId,
    userId,
    brainId: parsed.data.brainId,
    config: configResult.config,
  });

  if (!result.ok) {
    const status =
      result.code === "validation"
        ? 400
        : result.code === "config"
          ? 503
          : 502;
    console.error("[ai-team-member] realtime session route failure", {
      requestId,
      organizationHash: hashForDiagnostics(organizationId),
      brainHash: hashForDiagnostics(parsed.data.brainId),
      selectedModel: configResult.config.realtimeModel,
      errorCategory: result.code,
    });
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = toClientRealtimeSessionPayload(result);
  if (!assertNoPermanentApiKeyInPayload(payload, apiKeyResult.apiKey)) {
    return NextResponse.json(
      { error: "Realtime session payload rejected.", code: "config" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

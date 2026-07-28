import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { requireOrganizationProfile } from "@/lib/auth/session";
import { runMeetingAgent } from "@/modules/ai-team-member/lib/meeting-agent";
import { requireOpenAiApiKey } from "@/modules/ai-team-member/lib/meeting-config";
import {
  isBrainId,
  meetingAnalyzeBodySchema,
  meetingCheckpointSchema,
} from "@/modules/ai-team-member/lib/meeting-domain";
import type { MeetingResponsesParseClient } from "@/modules/ai-team-member/lib/meeting-response";

export async function POST(request: Request) {
  let organizationId = "";
  let userId = "";

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
    route: "analyze",
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: rate.message, code: rate.code },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  const parsed = meetingAnalyzeBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success || !isBrainId(parsed.data.brainId)) {
    return NextResponse.json(
      { error: "Invalid meeting payload." },
      { status: 400 },
    );
  }

  const apiKeyResult = requireOpenAiApiKey();
  if (!apiKeyResult.ok) {
    return NextResponse.json(
      { error: apiKeyResult.message, code: apiKeyResult.code },
      { status: 503 },
    );
  }

  const openai = new OpenAI({ apiKey: apiKeyResult.apiKey });
  const client = openai as unknown as MeetingResponsesParseClient;
  const result = await runMeetingAgent({
    organizationId,
    body: parsed.data,
    client,
    textFormat: zodTextFormat(meetingCheckpointSchema, "meeting_checkpoint"),
  });

  if (result.ok) {
    return NextResponse.json({
      insight: result.insight,
      meta: {
        usedWebSearch: result.usedWebSearch,
        usedBrainContext: result.usedBrainContext,
        brainId: parsed.data.brainId,
        mode: parsed.data.mode,
      },
    });
  }

  const status =
    result.code === "upstream"
      ? 502
      : result.code === "refused"
        ? 422
        : result.code === "config"
          ? 503
          : 502;

  return NextResponse.json(
    { error: result.message, code: result.code },
    { status },
  );
}

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { requireOrganizationProfile } from "@/lib/auth/session";
import { requireOpenAiApiKey } from "@/modules/ai-team-member/lib/meeting-config";
import {
  synthesizeMeetingSpeech,
  validateMeetingSpeechBody,
  type MeetingTtsClient,
} from "@/modules/ai-team-member/lib/meeting-tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    route: "speech",
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

  const validated = validateMeetingSpeechBody(
    await request.json().catch(() => null),
  );
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.message, code: validated.code },
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
  const client = openai as unknown as MeetingTtsClient;
  const result = await synthesizeMeetingSpeech({
    client,
    text: validated.body.text,
  });

  if (!result.ok) {
    const status =
      result.code === "validation"
        ? 400
        : result.code === "config"
          ? 503
          : 502;
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status },
    );
  }

  return new NextResponse(Buffer.from(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "no-store",
      "X-AI-Team-Member-TTS-Model": result.model,
      "X-AI-Team-Member-TTS-Voice": result.voice,
    },
  });
}

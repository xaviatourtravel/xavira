import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { requireOrganizationProfile } from "@/lib/auth/session";
import {
  isBrainId,
  meetingAnalyzeBodySchema,
  meetingCheckpointSchema,
} from "@/modules/ai-team-member/lib/meeting-domain";
import {
  requestMeetingCheckpoint,
  type MeetingResponsesParseClient,
} from "@/modules/ai-team-member/lib/meeting-response";

export async function POST(request: Request) {
  try {
    await requireOrganizationProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const client = openai as unknown as MeetingResponsesParseClient;
  const result = await requestMeetingCheckpoint({
    client,
    body: {
      ...parsed.data,
      brainId: parsed.data.brainId,
    },
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    textFormat: zodTextFormat(meetingCheckpointSchema, "meeting_checkpoint"),
  });

  if (result.ok) {
    return NextResponse.json({ insight: result.insight });
  }

  const status =
    result.code === "upstream"
      ? 502
      : result.code === "refused"
        ? 422
        : 502;

  return NextResponse.json(
    { error: result.message, code: result.code },
    { status },
  );
}

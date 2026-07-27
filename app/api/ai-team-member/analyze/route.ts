import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizationProfile } from "@/lib/auth/session";
import {
  buildMeetingPrompt,
  isBrainId,
  parseMeetingInsightFromModelOutput,
} from "@/modules/ai-team-member/lib/meeting-domain";

const bodySchema = z.object({
  brainId: z.string(),
  question: z.string().max(2000).optional(),
  transcript: z.array(z.object({
    id: z.string(), speaker: z.string().min(1).max(80), text: z.string().min(1).max(10000), createdAt: z.string(),
  })).max(500),
});

export async function POST(request: Request) {
  await requireOrganizationProfile();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isBrainId(parsed.data.brainId)) {
    return NextResponse.json({ error: "Invalid meeting payload." }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: buildMeetingPrompt({ brainId: parsed.data.brainId, transcript: parsed.data.transcript, question: parsed.data.question }),
  });
  const insight = parseMeetingInsightFromModelOutput(response.output_text);
  if (insight) {
    return NextResponse.json({ insight });
  }
  console.error("[ai-team-member] invalid model checkpoint format", {
    brainId: parsed.data.brainId,
    hasOutputText: Boolean(response.output_text),
    outputTextLength: response.output_text?.length ?? 0,
  });
  return NextResponse.json({ error: "AI returned an invalid meeting checkpoint." }, { status: 502 });
}

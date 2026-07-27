import type { MeetingInsight } from "@/modules/ai-team-member/lib/meeting-domain";

type BrowserSpeechSynthesisVoice = {
  name: string;
  lang: string;
  default?: boolean;
};

export function pickIndonesianVoice(
  voices: BrowserSpeechSynthesisVoice[],
): BrowserSpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const exact = voices.find((voice) => /^id-id$/i.test(voice.lang));
  if (exact) return exact;
  const generic = voices.find((voice) => /^id(?:-|$)/i.test(voice.lang));
  if (generic) return generic;
  return null;
}

/** TTS always speaks the structured responseText field. */
export function pickMeetingSpeechText(insight: MeetingInsight): string {
  return insight.responseText.trim();
}

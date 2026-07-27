import type { MeetingInsight } from "@/modules/ai-team-member/lib/meeting-domain";

type BrowserSpeechSynthesisVoice = {
  name: string;
  lang: string;
  default?: boolean;
};

function isRaiseHandIntent(question?: string): boolean {
  if (!question) return false;
  return /(angkat tangan|raise hand|raise your hand|intervensi)/i.test(question);
}

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

export function pickMeetingSpeechText(
  insight: MeetingInsight,
  question?: string,
): string {
  if (isRaiseHandIntent(question)) {
    return (
      insight.summary.trim() ||
      insight.unresolvedIssues[0]?.trim() ||
      insight.actionItems[0]?.task.trim() ||
      insight.decisions[0]?.trim() ||
      ""
    );
  }
  return (
    insight.summary.trim() ||
    insight.decisions[0]?.trim() ||
    insight.actionItems[0]?.task.trim() ||
    insight.unresolvedIssues[0]?.trim() ||
    ""
  );
}

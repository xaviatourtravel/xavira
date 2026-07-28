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

export type MeetingAudioPlayback = {
  audio: HTMLAudioElement;
  objectUrl: string;
};

export function revokeMeetingObjectUrl(objectUrl: string | null | undefined) {
  if (!objectUrl) return;
  try {
    URL.revokeObjectURL(objectUrl);
  } catch {
    // ignore revoke failures
  }
}

export function stopMeetingAudio(playback: MeetingAudioPlayback | null) {
  if (!playback) return;
  try {
    playback.audio.pause();
    playback.audio.removeAttribute("src");
    playback.audio.load();
  } catch {
    // ignore stop failures
  }
  revokeMeetingObjectUrl(playback.objectUrl);
}

export async function fetchMeetingSpeechAudio(params: {
  text: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; blob: Blob } | { ok: false; error: string }> {
  const fetchImpl = params.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl("/api/ai-team-member/speech", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: params.text }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return {
        ok: false,
        error:
          payload && typeof payload.error === "string"
            ? payload.error
            : "Layanan suara AI gagal.",
      };
    }
    const blob = await response.blob();
    return { ok: true, blob };
  } catch {
    return { ok: false, error: "Layanan suara AI gagal." };
  }
}

export function createMeetingAudioPlayback(
  blob: Blob,
  options?: {
    createObjectUrl?: (blob: Blob) => string;
    createAudio?: (objectUrl: string) => HTMLAudioElement;
  },
): MeetingAudioPlayback {
  const createObjectUrl = options?.createObjectUrl ?? URL.createObjectURL.bind(URL);
  const createAudio =
    options?.createAudio ?? ((objectUrl: string) => new Audio(objectUrl));
  const objectUrl = createObjectUrl(blob);
  const audio = createAudio(objectUrl);
  return { audio, objectUrl };
}

export function speakWithBrowserFallback(params: {
  text: string;
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
}): boolean {
  const synthesis =
    params.speechSynthesis ??
    (typeof window !== "undefined" ? window.speechSynthesis : undefined);
  const Utterance =
    params.SpeechSynthesisUtterance ??
    (typeof window !== "undefined" ? window.SpeechSynthesisUtterance : undefined);
  if (!synthesis || !Utterance || !params.text.trim()) return false;

  synthesis.cancel();
  const utterance = new Utterance(params.text);
  utterance.lang = "id-ID";
  const voice = pickIndonesianVoice(synthesis.getVoices());
  if (voice) utterance.voice = voice as SpeechSynthesisVoice;
  synthesis.speak(utterance);
  return true;
}

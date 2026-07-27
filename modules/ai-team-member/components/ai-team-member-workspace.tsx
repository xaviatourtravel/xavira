"use client";

import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Check,
  Hand,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Play,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  BRAIN_IDS,
  type BrainId,
  type MeetingInsight,
  type MeetingMode,
  type TranscriptEntry,
} from "../lib/meeting-domain";
import {
  appendConversationTurn,
  createEmptyConversationByBrain,
  getConversationForBrain,
  type ConversationByBrain,
} from "../lib/meeting-conversation";
import {
  createMeetingAudioPlayback,
  fetchMeetingSpeechAudio,
  pickMeetingSpeechText,
  speakWithBrowserFallback,
  stopMeetingAudio,
  type MeetingAudioPlayback,
} from "../lib/speech";
import {
  createRealtimeVoiceClient,
  type RealtimeCallPhase,
  type RealtimeVoiceClient,
} from "../lib/meeting-realtime-client";
import {
  extractRealtimeFunctionCall,
  extractRealtimeTranscriptEvent,
  mapRealtimeCallState,
  mapToolNameToUiStatus,
  mergeFinalRealtimeTranscript,
  parseRealtimeDataChannelEvent,
} from "../lib/meeting-realtime-events";
import type {
  TranscriptEvidenceKind,
  TranscriptEntrySourceLink,
} from "../lib/meeting-domain";

const LABELS: Record<BrainId, string> = {
  desklabs: "Desklabs",
  kreatifpedia: "Kreatifpedia",
  piatur: "Piatur",
  founder: "Founder",
};

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult:
    | ((event: {
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
      }) => void)
    | null;
  onend: (() => void) | null;
};

type ResponseMeta = {
  usedWebSearch: boolean;
  usedBrainContext: boolean;
  brainId: BrainId;
  mode: MeetingMode;
};

type LoadingPhase = "idle" | "thinking" | "searching" | "voice";

export function AiTeamMemberWorkspace({
  organizationId,
}: {
  organizationId: string;
}) {
  void organizationId;
  const { tStrict } = useTranslation();
  const [brainId, setBrainId] = useState<BrainId>("desklabs");
  const [speaker, setSpeaker] = useState("Irfan");
  const [transcriptByBrain, setTranscriptByBrain] = useState<
    Record<BrainId, TranscriptEntry[]>
  >({
    desklabs: [],
    kreatifpedia: [],
    piatur: [],
    founder: [],
  });
  const [conversationByBrain, setConversationByBrain] =
    useState<ConversationByBrain>(createEmptyConversationByBrain());
  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [insight, setInsight] = useState<MeetingInsight | null>(null);
  const [responseMeta, setResponseMeta] = useState<ResponseMeta | null>(null);
  const [approvedMemory, setApprovedMemory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [lastSpeechText, setLastSpeechText] = useState("");
  const [error, setError] = useState("");
  const [callPhase, setCallPhase] = useState<RealtimeCallPhase>("idle");
  const [callMuted, setCallMuted] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callElapsedSec, setCallElapsedSec] = useState(0);
  const [callWarning, setCallWarning] = useState("");
  const [toolStatus, setToolStatus] = useState<
    "idle" | "checking_brain" | "searching_web" | "analyzing" | "checking_memory"
  >("idle");
  const pendingSourcesRef = useRef<{
    sources: TranscriptEntrySourceLink[];
    evidenceKinds: TranscriptEvidenceKind[];
  }>({ sources: [], evidenceKinds: [] });
  const handledToolCallsRef = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<Recognition | null>(null);
  const speakerRef = useRef(speaker);
  const playbackRef = useRef<MeetingAudioPlayback | null>(null);
  const callClientRef = useRef<RealtimeVoiceClient | null>(null);
  const brainIdRef = useRef(brainId);

  const transcript = transcriptByBrain[brainId] ?? [];
  const loading = loadingPhase !== "idle";
  const callActive =
    callPhase !== "idle" &&
    callPhase !== "disconnected" &&
    callPhase !== "error";

  useEffect(() => {
    speakerRef.current = speaker;
  }, [speaker]);

  useEffect(() => {
    brainIdRef.current = brainId;
  }, [brainId]);

  useEffect(() => {
    if (callActive) return;
    setInsight(null);
    setResponseMeta(null);
    setApprovedMemory([]);
    setError("");
    stopMeetingAudio(playbackRef.current);
    playbackRef.current = null;
  }, [brainId, callActive]);

  useEffect(() => {
    return () => {
      stopMeetingAudio(playbackRef.current);
      playbackRef.current = null;
      callClientRef.current?.end();
      callClientRef.current = null;
    };
  }, []);

  useEffect(() => {
    function onPageHide() {
      callClientRef.current?.end();
      callClientRef.current = null;
      setCallStartedAt(null);
      setCallPhase("idle");
      setCallMuted(false);
    }
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useEffect(() => {
    if (!callStartedAt || !callActive) return;
    const timer = setInterval(() => {
      setCallElapsedSec(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [callStartedAt, callActive]);

  function addTranscript(text = draft) {
    const clean = text.trim();
    if (!clean) return;
    setTranscriptByBrain((current) => ({
      ...current,
      [brainId]: [
        ...(current[brainId] ?? []),
        {
          id: crypto.randomUUID(),
          speaker: speakerRef.current.trim() || "Speaker",
          text: clean,
          createdAt: new Date().toISOString(),
          source: "manual",
        },
      ],
    }));
    setDraft("");
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const RecognitionClass =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionClass) {
      setError(tStrict("aiTeamMemberUi.micUnsupported"));
      return;
    }
    const recognition = new RecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "id-ID";
    recognition.onresult = (event) => {
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result?.isFinal) addTranscript(result[0]?.transcript || "");
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setError("");
    setListening(true);
  }

  async function playSpeech(text: string, allowBrowserFallback: boolean) {
    if (voiceMuted || !text) return;
    stopMeetingAudio(playbackRef.current);
    playbackRef.current = null;
    setLoadingPhase("voice");

    const speech = await fetchMeetingSpeechAudio({ text });
    if (speech.ok) {
      const playback = createMeetingAudioPlayback(speech.blob);
      playbackRef.current = playback;
      playback.audio.onended = () => {
        stopMeetingAudio(playback);
        if (playbackRef.current === playback) playbackRef.current = null;
      };
      try {
        await playback.audio.play();
      } catch {
        stopMeetingAudio(playback);
        playbackRef.current = null;
        if (allowBrowserFallback) speakWithBrowserFallback({ text });
      }
      return;
    }

    if (allowBrowserFallback) {
      speakWithBrowserFallback({ text });
    }
  }

  async function startVoiceCall() {
    if (callActive || callClientRef.current?.isActive()) {
      setError(tStrict("aiTeamMemberUi.callFailed"));
      return;
    }

    stopMeetingAudio(playbackRef.current);
    playbackRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    setCallWarning("");
    setError("");
    setCallElapsedSec(0);
    setToolStatus("idle");
    pendingSourcesRef.current = { sources: [], evidenceKinds: [] };
    handledToolCallsRef.current = new Set();

    try {
      const response = await fetch("/api/ai-team-member/realtime/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brainId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || tStrict("aiTeamMemberUi.callFailed"));
      }
      if (!payload.clientSecret || typeof payload.clientSecret !== "string") {
        throw new Error(tStrict("aiTeamMemberUi.callFailed"));
      }

      const client = createRealtimeVoiceClient({
        onPhase: (phase) => setCallPhase(phase),
        onError: (message) => {
          if (/mikrofon/i.test(message)) {
            setError(tStrict("aiTeamMemberUi.callMicDenied"));
          } else if (/Durasi maksimum|batas waktu/i.test(message)) {
            setError(tStrict("aiTeamMemberUi.callEndedMax"));
          } else {
            setError(message);
          }
        },
        onWarningNearMax: () =>
          setCallWarning(tStrict("aiTeamMemberUi.callNearMax")),
        onEnded: () => {
          setCallStartedAt(null);
          setToolStatus("idle");
          callClientRef.current = null;
        },
        onDataEvent: (raw) => {
          const parsed = parseRealtimeDataChannelEvent(raw);
          if (!parsed) return;
          const nextPhase = mapRealtimeCallState(parsed.type);
          if (nextPhase) setCallPhase(nextPhase);

          const toolCall = extractRealtimeFunctionCall(parsed);
          if (toolCall && !handledToolCallsRef.current.has(toolCall.callId)) {
            handledToolCallsRef.current.add(toolCall.callId);
            setToolStatus(mapToolNameToUiStatus(toolCall.name));
            void (async () => {
              try {
                const toolResponse = await fetch(
                  "/api/ai-team-member/realtime/tools/execute",
                  {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      brainId: brainIdRef.current,
                      callId: toolCall.callId,
                      name: toolCall.name,
                      arguments: toolCall.arguments,
                    }),
                  },
                );
                const toolPayload = await toolResponse.json();
                const output =
                  typeof toolPayload.output === "string"
                    ? toolPayload.output
                    : JSON.stringify({
                        message: "Tool gagal.",
                      });
                callClientRef.current?.sendFunctionCallOutput({
                  callId: toolCall.callId,
                  output,
                });
                const sources = Array.isArray(toolPayload.sources)
                  ? (toolPayload.sources as TranscriptEntrySourceLink[]).map(
                      (source) => ({
                        title: String(source.title || "Sumber"),
                        url: source.url,
                        category: source.category,
                      }),
                    )
                  : [];
                const kind = toolPayload.sources?.[0]?.kind as
                  | TranscriptEvidenceKind
                  | undefined;
                if (sources.length) {
                  pendingSourcesRef.current = {
                    sources: [
                      ...pendingSourcesRef.current.sources,
                      ...sources,
                    ].slice(0, 8),
                    evidenceKinds: kind
                      ? [
                          ...new Set([
                            ...pendingSourcesRef.current.evidenceKinds,
                            kind,
                          ]),
                        ]
                      : pendingSourcesRef.current.evidenceKinds,
                  };
                }
              } catch {
                callClientRef.current?.sendFunctionCallOutput({
                  callId: toolCall.callId,
                  output: JSON.stringify({
                    message:
                      "Lookup gagal. Lanjut dengan pengetahuan yang tersedia.",
                  }),
                });
              } finally {
                setToolStatus("idle");
              }
            })();
          }

          const transcriptEvent = extractRealtimeTranscriptEvent(parsed);
          if (!transcriptEvent || transcriptEvent.status !== "final") return;
          const extras =
            transcriptEvent.role === "assistant"
              ? {
                  sources: pendingSourcesRef.current.sources,
                  evidenceKinds: pendingSourcesRef.current.evidenceKinds,
                }
              : undefined;
          if (transcriptEvent.role === "assistant") {
            pendingSourcesRef.current = { sources: [], evidenceKinds: [] };
          }
          setTranscriptByBrain((current) => ({
            ...current,
            [brainIdRef.current]: mergeFinalRealtimeTranscript(
              current[brainIdRef.current] ?? [],
              transcriptEvent,
              speakerRef.current.trim() || "Speaker",
              extras,
            ),
          }));
        },
      });

      callClientRef.current = client;
      setCallStartedAt(Date.now());
      await client.start({
        clientSecret: payload.clientSecret,
        callsUrl: payload.callsUrl,
        maxMinutes: Number(payload.maxMinutes) || 20,
        warningAtMinutes: Number(payload.warningAtMinutes) || 18,
      });
    } catch (cause) {
      callClientRef.current?.end();
      callClientRef.current = null;
      setCallStartedAt(null);
      setCallPhase("error");
      setError(
        cause instanceof Error
          ? cause.message
          : tStrict("aiTeamMemberUi.callFailed"),
      );
    }
  }

  function endVoiceCall() {
    callClientRef.current?.end();
    callClientRef.current = null;
    setCallStartedAt(null);
    setCallPhase("idle");
    setCallMuted(false);
    setToolStatus("idle");
  }

  function toggleCallMute() {
    const next = !callMuted;
    setCallMuted(next);
    callClientRef.current?.setMuted(next);
  }

  function formatCallDuration(totalSec: number) {
    const minutes = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSec % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  const callStatusLabel =
    toolStatus === "checking_brain"
      ? tStrict("aiTeamMemberUi.callCheckingBrain")
      : toolStatus === "searching_web"
        ? tStrict("aiTeamMemberUi.callSearchingWeb")
        : toolStatus === "analyzing"
          ? tStrict("aiTeamMemberUi.callAnalyzing")
          : toolStatus === "checking_memory"
            ? tStrict("aiTeamMemberUi.callCheckingMemory")
            : callPhase === "listening"
              ? tStrict("aiTeamMemberUi.callListening")
              : callPhase === "thinking"
                ? tStrict("aiTeamMemberUi.callThinking")
                : callPhase === "speaking"
                  ? tStrict("aiTeamMemberUi.callSpeaking")
                  : callPhase === "connecting" ||
                      callPhase === "requesting_permission"
                    ? tStrict("aiTeamMemberUi.callConnecting")
                    : callPhase === "disconnected" || callPhase === "error"
                      ? tStrict("aiTeamMemberUi.callDisconnected")
                      : "";

  async function askAi(mode: MeetingMode) {
    if (loading) return;
    if (!transcript.length) {
      setError(tStrict("aiTeamMemberUi.needTranscript"));
      return;
    }

    const askedQuestion = question.trim();
    setLoadingPhase(mode === "ask" && useWebSearch ? "searching" : "thinking");
    setError("");

    try {
      const response = await fetch("/api/ai-team-member/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brainId,
          transcript,
          mode,
          question: askedQuestion || undefined,
          useWebSearch: mode === "ask" ? useWebSearch : false,
          conversationHistory: getConversationForBrain(
            conversationByBrain,
            brainId,
          ),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || tStrict("aiTeamMemberUi.aiFailed"));
      }

      const nextInsight = payload.insight as MeetingInsight;
      setInsight(nextInsight);
      setResponseMeta({
        usedWebSearch: Boolean(payload.meta?.usedWebSearch),
        usedBrainContext: Boolean(payload.meta?.usedBrainContext),
        brainId,
        mode,
      });

      if (askedQuestion || mode === "ask" || mode === "raise_hand") {
        setConversationByBrain((current) => {
          let next = current;
          if (askedQuestion) {
            next = appendConversationTurn({
              state: next,
              brainId,
              turn: { role: "user", text: askedQuestion, mode },
            });
          }
          if (nextInsight.responseText.trim()) {
            next = appendConversationTurn({
              state: next,
              brainId,
              turn: {
                role: "assistant",
                text: nextInsight.responseText.trim(),
                mode,
              },
            });
          }
          return next;
        });
      }

      setQuestion("");
      const speakText = pickMeetingSpeechText(nextInsight);
      setLastSpeechText(speakText);
      await playSpeech(speakText, true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : tStrict("aiTeamMemberUi.aiFailed"),
      );
    } finally {
      setLoadingPhase("idle");
    }
  }

  const statusLabel =
    loadingPhase === "searching"
      ? tStrict("aiTeamMemberUi.searchingLatest")
      : loadingPhase === "voice"
        ? tStrict("aiTeamMemberUi.preparingVoice")
        : loadingPhase === "thinking"
          ? tStrict("aiTeamMemberUi.thinking")
          : "";

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {tStrict("aiTeamMemberUi.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {tStrict("aiTeamMemberUi.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tStrict("aiTeamMemberUi.subtitle")}
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            {tStrict("aiTeamMemberUi.brain")}
          </span>
          <select
            value={brainId}
            disabled={callActive}
            onChange={(event) => {
              if (callActive) {
                setError(tStrict("aiTeamMemberUi.callActiveBrainLock"));
                return;
              }
              setBrainId(event.target.value as BrainId);
            }}
            className="bg-transparent font-medium outline-none disabled:opacity-50"
          >
            {BRAIN_IDS.map((id) => (
              <option key={id} value={id}>
                {LABELS[id]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b p-4">
            <input
              value={speaker}
              onChange={(event) => setSpeaker(event.target.value)}
              aria-label={tStrict("aiTeamMemberUi.currentSpeaker")}
              className="h-10 w-40 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={toggleMic}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium ${
                listening
                  ? "bg-red-500 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {listening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              {listening
                ? tStrict("aiTeamMemberUi.stopListening")
                : tStrict("aiTeamMemberUi.liveTranscript")}
            </button>
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  listening
                    ? "animate-pulse bg-red-500"
                    : "bg-muted-foreground/30"
                }`}
              />
              {listening
                ? tStrict("aiTeamMemberUi.listening")
                : tStrict("aiTeamMemberUi.standby")}
            </span>
          </div>
          <div className="min-h-[420px] space-y-4 p-5">
            {transcript.length ? (
              transcript.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[90px_1fr] gap-3 text-sm"
                >
                  <span className="font-semibold text-primary">
                    {item.speaker}
                  </span>
                  <div>
                    <p className="leading-6 text-foreground/90">{item.text}</p>
                    {item.source === "realtime" ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {tStrict("aiTeamMemberUi.realtimeTranscriptSource")}
                        {item.evidenceKinds?.length
                          ? ` · ${item.evidenceKinds
                              .map((kind) =>
                                kind === "business_brain"
                                  ? tStrict("aiTeamMemberUi.evidenceBrain")
                                  : kind === "web"
                                    ? tStrict("aiTeamMemberUi.evidenceWeb")
                                    : kind === "deep_analysis"
                                      ? tStrict(
                                          "aiTeamMemberUi.evidenceAnalysis",
                                        )
                                      : tStrict("aiTeamMemberUi.evidenceMemory"),
                              )
                              .join(" / ")}`
                          : ""}
                      </p>
                    ) : null}
                    {item.sources?.length ? (
                      <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                        {item.sources.map((source) => (
                          <li key={`${source.title}-${source.url || ""}`}>
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline-offset-2 hover:underline"
                              >
                                {source.title || source.url}
                              </a>
                            ) : (
                              source.title
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center text-muted-foreground">
                <Volume2 className="mb-4 h-9 w-9 opacity-40" />
                <p className="font-medium text-foreground">
                  {tStrict("aiTeamMemberUi.roomReady")}
                </p>
                <p className="mt-1 max-w-sm text-sm">
                  {tStrict("aiTeamMemberUi.roomReadyHint")}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t p-4">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={tStrict("aiTeamMemberUi.draftPlaceholder")}
              className="min-h-12 flex-1 resize-none rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => addTranscript()}
              aria-label={tStrict("aiTeamMemberUi.addTranscript")}
              className="h-12 rounded-xl border px-4 hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Phone className="h-4 w-4 text-primary" />
              {tStrict("aiTeamMemberUi.voiceCallTitle")}
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {tStrict("aiTeamMemberUi.selectedBrain")}: {LABELS[brainId]}
            </p>
            {!callActive ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void startVoiceCall()}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Phone className="h-4 w-4" />
                {tStrict("aiTeamMemberUi.startVoiceCall")}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium" aria-live="polite">
                    {callStatusLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {tStrict("aiTeamMemberUi.callDuration")}:{" "}
                    {formatCallDuration(callElapsedSec)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleCallMute}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-medium"
                    aria-label={
                      callMuted
                        ? tStrict("aiTeamMemberUi.unmuteMic")
                        : tStrict("aiTeamMemberUi.muteMic")
                    }
                  >
                    {callMuted ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    {callMuted
                      ? tStrict("aiTeamMemberUi.unmuteMic")
                      : tStrict("aiTeamMemberUi.muteMic")}
                  </button>
                  <button
                    type="button"
                    onClick={endVoiceCall}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-medium text-white"
                  >
                    <PhoneOff className="h-4 w-4" />
                    {tStrict("aiTeamMemberUi.endVoiceCall")}
                  </button>
                </div>
                {callWarning ? (
                  <p className="text-xs text-amber-600">{callWarning}</p>
                ) : null}
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">
              {tStrict("aiTeamMemberUi.callRealtimeDisclosure")}
            </p>
          </div>

          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              {tStrict("aiTeamMemberUi.talkToAi")}
            </h2>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={tStrict("aiTeamMemberUi.askPlaceholder")}
              className="mt-4 min-h-24 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={useWebSearch}
                disabled={loading}
                onChange={(event) => setUseWebSearch(event.target.checked)}
                className="h-4 w-4 rounded border"
              />
              {tStrict("aiTeamMemberUi.searchWeb")}
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                disabled={loading || callActive}
                onClick={() => askAi("ask")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {tStrict("aiTeamMemberUi.askAi")}
              </button>
              <button
                disabled={loading || callActive}
                onClick={() => askAi("raise_hand")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-medium disabled:opacity-50"
              >
                <Hand className="h-4 w-4" />
                {tStrict("aiTeamMemberUi.raiseHand")}
              </button>
            </div>
            {statusLabel ? (
              <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
                {statusLabel}
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm text-red-500">{error}</p>
            ) : null}
          </div>

          {insight ? (
            <div className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm">
              {insight.responseText ? (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {tStrict("aiTeamMemberUi.responseLabel")}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!lastSpeechText || loading}
                        onClick={() => playSpeech(lastSpeechText, true)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs disabled:opacity-50"
                        aria-label={tStrict("aiTeamMemberUi.replayVoice")}
                      >
                        <Play className="h-3.5 w-3.5" />
                        {tStrict("aiTeamMemberUi.replayVoice")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextMuted = !voiceMuted;
                          setVoiceMuted(nextMuted);
                          if (nextMuted) {
                            stopMeetingAudio(playbackRef.current);
                            playbackRef.current = null;
                            if ("speechSynthesis" in window) {
                              window.speechSynthesis.cancel();
                            }
                          }
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs"
                        aria-label={
                          voiceMuted
                            ? tStrict("aiTeamMemberUi.unmuteVoice")
                            : tStrict("aiTeamMemberUi.muteVoice")
                        }
                      >
                        {voiceMuted ? (
                          <VolumeX className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                    {insight.responseText}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {tStrict("aiTeamMemberUi.voiceDisclosure")}
                  </p>
                </div>
              ) : null}

              {responseMeta ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {responseMeta.usedBrainContext ? (
                    <span className="rounded-full border px-2 py-1">
                      {tStrict("aiTeamMemberUi.usedBrain")}
                    </span>
                  ) : null}
                  {responseMeta.usedWebSearch ? (
                    <span className="rounded-full border px-2 py-1">
                      {tStrict("aiTeamMemberUi.usedWebSearch")}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {insight.sources?.length ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {tStrict("aiTeamMemberUi.sources")}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {insight.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline-offset-2 hover:underline"
                        >
                          {source.title || source.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <InsightSection
                title={tStrict("aiTeamMemberUi.summary")}
                items={[insight.summary]}
              />
              <InsightSection
                title={tStrict("aiTeamMemberUi.decisions")}
                items={insight.decisions}
              />
              <InsightSection
                title={tStrict("aiTeamMemberUi.actionItems")}
                items={insight.actionItems.map(
                  (item) =>
                    `${item.task}${item.pic ? ` — ${item.pic}` : ""}${
                      item.deadline ? ` · ${item.deadline}` : ""
                    }`,
                )}
              />
              <InsightSection
                title={tStrict("aiTeamMemberUi.unresolved")}
                items={insight.unresolvedIssues}
              />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tStrict("aiTeamMemberUi.memoryApproval")}
                </h3>
                <div className="mt-2 space-y-2">
                  {insight.memoryCandidates.map((memory) => {
                    const approved = approvedMemory.includes(memory);
                    return (
                      <button
                        key={memory}
                        onClick={() =>
                          !approved &&
                          setApprovedMemory((items) => [...items, memory])
                        }
                        className="flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm hover:bg-muted/30"
                      >
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            approved
                              ? "text-emerald-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                        {memory}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function InsightSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {filtered.map((item, index) => (
          <li key={`${title}-${index}`} className="text-sm leading-6">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

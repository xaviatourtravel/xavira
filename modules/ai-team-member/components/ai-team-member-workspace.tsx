"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Check, Hand, Mic, MicOff, Play, Plus, Sparkles, Volume2 } from "lucide-react";
import { BRAIN_IDS, type BrainId, type MeetingInsight, type TranscriptEntry } from "../lib/meeting-domain";
import { pickIndonesianVoice, pickMeetingSpeechText } from "../lib/speech";

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
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
};

export function AiTeamMemberWorkspace({ organizationId }: { organizationId: string }) {
  const [brainId, setBrainId] = useState<BrainId>("desklabs");
  const [speaker, setSpeaker] = useState("Irfan");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState("");
  const [insight, setInsight] = useState<MeetingInsight | null>(null);
  const [approvedMemory, setApprovedMemory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const speakerRef = useRef(speaker);

  useEffect(() => { speakerRef.current = speaker; }, [speaker]);
  useEffect(() => {
    setTranscript([]);
    setInsight(null);
    setApprovedMemory([]);
  }, [brainId]);

  function addTranscript(text = draft) {
    const clean = text.trim();
    if (!clean) return;
    setTranscript((items) => [...items, {
      id: crypto.randomUUID(),
      speaker: speakerRef.current.trim() || "Speaker",
      text: clean,
      createdAt: new Date().toISOString(),
    }]);
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
    const RecognitionClass = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionClass) {
      setError("Live transcript tersedia di Chrome atau Edge.");
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

  async function askAi(prompt = question) {
    if (!transcript.length) {
      setError("Tambahkan transcript dulu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai-team-member/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brainId, transcript, question: prompt || undefined, organizationId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI gagal merespons.");
      setInsight(payload.insight);
      setQuestion("");
      const speakText = pickMeetingSpeechText(payload.insight, prompt);
      if ("speechSynthesis" in window && speakText) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speakText);
        utterance.lang = "id-ID";
        const voice = pickIndonesianVoice(window.speechSynthesis.getVoices());
        if (voice) utterance.voice = voice as SpeechSynthesisVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI gagal merespons.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Intelligence workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">AI Team Member</h1>
          <p className="mt-2 text-sm text-muted-foreground">Teman meeting yang mendengar, berpikir, lalu merapikan keputusan dan tindak lanjut.</p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Brain</span>
          <select value={brainId} onChange={(event) => setBrainId(event.target.value as BrainId)} className="bg-transparent font-medium outline-none">
            {BRAIN_IDS.map((id) => <option key={id} value={id}>{LABELS[id]}</option>)}
          </select>
        </label>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b p-4">
            <input value={speaker} onChange={(event) => setSpeaker(event.target.value)} aria-label="Current speaker" className="h-10 w-40 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={toggleMic} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium ${listening ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"}`}>
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? "Stop listening" : "Live transcript"}
            </button>
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${listening ? "animate-pulse bg-red-500" : "bg-muted-foreground/30"}`} />
              {listening ? "Mendengarkan" : "Standby"}
            </span>
          </div>
          <div className="min-h-[420px] space-y-4 p-5">
            {transcript.length ? transcript.map((item) => (
              <div key={item.id} className="grid grid-cols-[90px_1fr] gap-3 text-sm">
                <span className="font-semibold text-primary">{item.speaker}</span>
                <p className="leading-6 text-foreground/90">{item.text}</p>
              </div>
            )) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center text-muted-foreground">
                <Volume2 className="mb-4 h-9 w-9 opacity-40" />
                <p className="font-medium text-foreground">Meeting room siap</p>
                <p className="mt-1 max-w-sm text-sm">Pilih speaker lalu nyalakan mic, atau masukkan catatan meeting secara manual.</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t p-4">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tambahkan ucapan atau catatan meeting…" className="min-h-12 flex-1 resize-none rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={() => addTranscript()} aria-label="Add transcript" className="h-12 rounded-xl border px-4 hover:bg-muted"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Talk to AI</h2>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Tanya pendapat AI tentang diskusi ini…" className="mt-4 min-h-24 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button disabled={loading} onClick={() => askAi()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"><Play className="h-4 w-4" /> Ask AI</button>
              <button disabled={loading} onClick={() => askAi("Angkat tangan hanya jika ada risiko material, kontradiksi, asumsi yang belum teruji, atau keputusan penting yang belum dibuat. Sampaikan intervensi secara singkat dan langsung.")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-medium disabled:opacity-50"><Hand className="h-4 w-4" /> Raise hand</button>
            </div>
            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
          </div>

          {insight ? <div className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm">
            <InsightSection title="Summary" items={[insight.summary]} />
            <InsightSection title="Decisions" items={insight.decisions} />
            <InsightSection title="Action items" items={insight.actionItems.map((item) => `${item.task}${item.pic ? ` — ${item.pic}` : ""}${item.deadline ? ` · ${item.deadline}` : ""}`)} />
            <InsightSection title="Unresolved" items={insight.unresolvedIssues} />
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Memory approval</h3>
              <div className="mt-2 space-y-2">{insight.memoryCandidates.map((memory) => {
                const approved = approvedMemory.includes(memory);
                return <button key={memory} onClick={() => !approved && setApprovedMemory((items) => [...items, memory])} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm hover:bg-muted/30">
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${approved ? "text-emerald-500" : "text-muted-foreground/30"}`} />{memory}
                </button>;
              })}</div>
            </div>
          </div> : null}
        </aside>
      </section>
    </main>
  );
}

function InsightSection({ title, items }: { title: string; items: string[] }) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return null;
  return <div><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3><ul className="mt-2 space-y-2">{filtered.map((item, index) => <li key={`${title}-${index}`} className="text-sm leading-6">{item}</li>)}</ul></div>;
}

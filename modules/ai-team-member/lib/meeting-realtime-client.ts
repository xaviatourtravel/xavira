import { REALTIME_CALLS_URL } from "@/modules/ai-team-member/lib/meeting-realtime-events";

export type RealtimeCallPhase =
  | "idle"
  | "requesting_permission"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | "error";

export type RealtimeClientDeps = {
  getUserMedia?: typeof navigator.mediaDevices.getUserMedia;
  RTCPeerConnection?: typeof RTCPeerConnection;
  fetchImpl?: typeof fetch;
  createAudioElement?: () => HTMLAudioElement;
  now?: () => number;
};

export type RealtimeClientCallbacks = {
  onPhase?: (phase: RealtimeCallPhase) => void;
  onError?: (message: string) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
  onDataEvent?: (raw: string) => void;
  onEnded?: () => void;
  onWarningNearMax?: () => void;
};

export type RealtimeSessionCredentials = {
  clientSecret: string;
  callsUrl?: string;
  maxMinutes: number;
  warningAtMinutes: number;
};

export type RealtimeVoiceClient = {
  start: (credentials: RealtimeSessionCredentials) => Promise<void>;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
  end: () => void;
  getPhase: () => RealtimeCallPhase;
  isActive: () => boolean;
};

let activeClientToken: symbol | null = null;

export function hasActiveRealtimeClient(): boolean {
  return activeClientToken != null;
}

/** Test-only: clear the single-active-session guard between cases. */
export function resetActiveRealtimeClientForTests(): void {
  activeClientToken = null;
}

export function createRealtimeVoiceClient(
  callbacks: RealtimeClientCallbacks = {},
  deps: RealtimeClientDeps = {},
): RealtimeVoiceClient {
  const token = Symbol("realtime-client");
  let phase: RealtimeCallPhase = "idle";
  let peer: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let remoteStream: MediaStream | null = null;
  let dataChannel: RTCDataChannel | null = null;
  let audioEl: HTMLAudioElement | null = null;
  let muted = false;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;
  let warnTimer: ReturnType<typeof setTimeout> | null = null;
  let ended = false;

  function setPhase(next: RealtimeCallPhase) {
    phase = next;
    callbacks.onPhase?.(next);
  }

  function clearTimers() {
    if (maxTimer) clearTimeout(maxTimer);
    if (warnTimer) clearTimeout(warnTimer);
    maxTimer = null;
    warnTimer = null;
  }

  function stopTracks(stream: MediaStream | null) {
    if (!stream) return;
    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {
        // ignore
      }
    }
  }

  function endInternal(reason?: string) {
    if (ended) return;
    ended = true;
    clearTimers();

    try {
      dataChannel?.close();
    } catch {
      // ignore
    }
    dataChannel = null;

    try {
      peer?.close();
    } catch {
      // ignore
    }
    peer = null;

    stopTracks(localStream);
    localStream = null;
    stopTracks(remoteStream);
    remoteStream = null;
    callbacks.onRemoteStream?.(null);

    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.srcObject = null;
      } catch {
        // ignore
      }
      audioEl = null;
    }

    if (activeClientToken === token) {
      activeClientToken = null;
    }

    if (reason) {
      setPhase("error");
      callbacks.onError?.(reason);
    } else if (phase !== "idle") {
      setPhase("disconnected");
    }
    callbacks.onEnded?.();
  }

  return {
    getPhase: () => phase,
    isActive: () => activeClientToken === token && !ended,
    isMuted: () => muted,
    setMuted(nextMuted: boolean) {
      muted = nextMuted;
      if (!localStream) return;
      for (const track of localStream.getAudioTracks()) {
        track.enabled = !nextMuted;
      }
    },
    end() {
      endInternal();
      setPhase("idle");
    },
    async start(credentials: RealtimeSessionCredentials) {
      if (activeClientToken && activeClientToken !== token) {
        throw new Error("Hanya satu sesi Voice Call yang boleh aktif.");
      }
      if (activeClientToken === token && !ended) {
        throw new Error("Sesi Voice Call sudah aktif.");
      }

      ended = false;
      activeClientToken = token;
      setPhase("requesting_permission");

      const getUserMedia =
        deps.getUserMedia ??
        navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
      const PeerConnection = deps.RTCPeerConnection ?? RTCPeerConnection;
      const fetchImpl = deps.fetchImpl ?? fetch;
      const createAudioElement =
        deps.createAudioElement ?? (() => new Audio());

      if (!getUserMedia || !PeerConnection) {
        endInternal("Browser ini belum mendukung Voice Call WebRTC.");
        throw new Error("Browser ini belum mendukung Voice Call WebRTC.");
      }

      try {
        localStream = await getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } catch {
        endInternal("Izin mikrofon ditolak atau tidak tersedia.");
        throw new Error("Izin mikrofon ditolak atau tidak tersedia.");
      }

      setPhase("connecting");
      peer = new PeerConnection();

      for (const track of localStream.getAudioTracks()) {
        track.enabled = !muted;
        peer.addTrack(track, localStream);
      }

      audioEl = createAudioElement();
      audioEl.autoplay = true;
      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        remoteStream = stream;
        if (audioEl) {
          audioEl.srcObject = stream;
          void audioEl.play().catch(() => undefined);
        }
        callbacks.onRemoteStream?.(stream);
      };

      dataChannel = peer.createDataChannel("oai-events");
      dataChannel.onmessage = (event) => {
        if (typeof event.data === "string") {
          callbacks.onDataEvent?.(event.data);
        }
      };

      peer.onconnectionstatechange = () => {
        const state = peer?.connectionState;
        if (state === "failed" || state === "disconnected" || state === "closed") {
          endInternal(
            state === "failed"
              ? "Koneksi Voice Call terputus."
              : undefined,
          );
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const response = await fetchImpl(
        credentials.callsUrl || REALTIME_CALLS_URL,
        {
          method: "POST",
          body: offer.sdp ?? "",
          headers: {
            Authorization: `Bearer ${credentials.clientSecret}`,
            "Content-Type": "application/sdp",
          },
        },
      );

      if (!response.ok) {
        endInternal("Gagal menghubungkan Voice Call ke OpenAI.");
        throw new Error("Gagal menghubungkan Voice Call ke OpenAI.");
      }

      const answerSdp = await response.text();
      await peer.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      const maxMs = credentials.maxMinutes * 60_000;
      const warnMs = credentials.warningAtMinutes * 60_000;
      warnTimer = setTimeout(() => {
        callbacks.onWarningNearMax?.();
      }, Math.max(0, warnMs));
      maxTimer = setTimeout(() => {
        endInternal("Durasi maksimum Voice Call tercapai.");
      }, maxMs);

      setPhase("listening");
    },
  };
}

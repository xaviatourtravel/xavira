import assert from "node:assert/strict";
import test from "node:test";
import {
  createRealtimeVoiceClient,
  hasActiveRealtimeClient,
  resetActiveRealtimeClientForTests,
  type RealtimeCallPhase,
} from "./meeting-realtime-client";

type FakeTrack = {
  kind: string;
  enabled: boolean;
  stopped: boolean;
  stop: () => void;
};

function createFakeTrack(kind = "audio"): FakeTrack {
  const track: FakeTrack = {
    kind,
    enabled: true,
    stopped: false,
    stop() {
      track.stopped = true;
    },
  };
  return track;
}

function createFakeStream(tracks: FakeTrack[]): MediaStream {
  return {
    getTracks: () => tracks as unknown as MediaStreamTrack[],
    getAudioTracks: () =>
      tracks.filter((t) => t.kind === "audio") as unknown as MediaStreamTrack[],
  } as unknown as MediaStream;
}

class FakePeerConnection {
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  connectionState: RTCPeerConnectionState = "new";
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  closed = false;
  addedTracks: MediaStreamTrack[] = [];
  dataChannel: {
    close: () => void;
    onmessage: ((event: MessageEvent) => void) | null;
  } | null = null;

  addTrack(track: MediaStreamTrack) {
    this.addedTracks.push(track);
  }

  createDataChannel() {
    this.dataChannel = {
      close: () => undefined,
      onmessage: null,
    };
    return this.dataChannel as unknown as RTCDataChannel;
  }

  async createOffer() {
    return { type: "offer" as const, sdp: "v=0\r\noffer" };
  }

  async setLocalDescription(desc: RTCSessionDescriptionInit) {
    this.localDescription = desc;
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    this.remoteDescription = desc;
    this.connectionState = "connected";
  }

  close() {
    this.closed = true;
    this.connectionState = "closed";
  }
}

function peerFactory(holder: { peer: FakePeerConnection | null }) {
  return function FakeCtor() {
    holder.peer = new FakePeerConnection();
    return holder.peer as unknown as RTCPeerConnection;
  } as unknown as typeof RTCPeerConnection;
}

function requirePeer(holder: { peer: FakePeerConnection | null }): FakePeerConnection {
  assert.ok(holder.peer);
  return holder.peer as FakePeerConnection;
}

test.beforeEach(() => {
  resetActiveRealtimeClientForTests();
});

test("explicit start is required; client begins idle", () => {
  const client = createRealtimeVoiceClient();
  assert.equal(client.getPhase(), "idle");
  assert.equal(client.isActive(), false);
  assert.equal(hasActiveRealtimeClient(), false);
});

test("WebRTC lifecycle attaches remote audio and closes cleanly", async () => {
  const localTrack = createFakeTrack();
  const remoteTrack = createFakeTrack();
  const remoteStream = createFakeStream([remoteTrack]);
  const phases: RealtimeCallPhase[] = [];
  let attachedRemote: MediaStream | null = null;
  const holder: { peer: FakePeerConnection | null } = { peer: null };
  const audio = {
    autoplay: false,
    srcObject: null as MediaStream | null,
    play: async () => undefined,
    pause: () => undefined,
  };

  const client = createRealtimeVoiceClient(
    {
      onPhase: (phase) => phases.push(phase),
      onRemoteStream: (stream) => {
        attachedRemote = stream;
      },
    },
    {
      getUserMedia: async () => createFakeStream([localTrack]),
      RTCPeerConnection: peerFactory(holder),
      createAudioElement: () => audio as unknown as HTMLAudioElement,
      fetchImpl: (async () =>
        new Response("v=0\r\nanswer", { status: 200 })) as typeof fetch,
    },
  );

  await client.start({
    clientSecret: "ek_test",
    maxMinutes: 20,
    warningAtMinutes: 18,
  });

  const peer = requirePeer(holder);
  peer.ontrack?.({
    streams: [remoteStream],
  } as unknown as RTCTrackEvent);

  assert.equal(audio.srcObject, remoteStream);
  assert.equal(attachedRemote, remoteStream);
  assert.equal(client.getPhase(), "listening");
  assert.equal(hasActiveRealtimeClient(), true);
  assert.ok(phases.includes("requesting_permission"));
  assert.ok(phases.includes("connecting"));
  assert.ok(phases.includes("listening"));

  client.end();
  assert.equal(localTrack.stopped, true);
  assert.equal(remoteTrack.stopped, true);
  assert.equal(peer.closed, true);
  assert.equal(audio.srcObject, null);
  assert.equal(client.getPhase(), "idle");
  assert.equal(hasActiveRealtimeClient(), false);
});

test("mic mute toggles outgoing track without ending session", async () => {
  const localTrack = createFakeTrack();
  const holder: { peer: FakePeerConnection | null } = { peer: null };
  const client = createRealtimeVoiceClient(
    {},
    {
      getUserMedia: async () => createFakeStream([localTrack]),
      RTCPeerConnection: peerFactory(holder),
      createAudioElement: () =>
        ({
          autoplay: true,
          srcObject: null,
          play: async () => undefined,
          pause: () => undefined,
        }) as unknown as HTMLAudioElement,
      fetchImpl: (async () =>
        new Response("answer", { status: 200 })) as typeof fetch,
    },
  );

  await client.start({
    clientSecret: "ek_test",
    maxMinutes: 20,
    warningAtMinutes: 18,
  });
  assert.equal(localTrack.enabled, true);
  client.setMuted(true);
  assert.equal(client.isMuted(), true);
  assert.equal(localTrack.enabled, false);
  assert.equal(client.isActive(), true);
  assert.equal(requirePeer(holder).closed, false);
  client.setMuted(false);
  assert.equal(localTrack.enabled, true);
  client.end();
});

test("only one concurrent client session is allowed", async () => {
  const makeClient = () => {
    const holder: { peer: FakePeerConnection | null } = { peer: null };
    return createRealtimeVoiceClient(
      {},
      {
        getUserMedia: async () => createFakeStream([createFakeTrack()]),
        RTCPeerConnection: peerFactory(holder),
        createAudioElement: () =>
          ({
            autoplay: true,
            srcObject: null,
            play: async () => undefined,
            pause: () => undefined,
          }) as unknown as HTMLAudioElement,
        fetchImpl: (async () =>
          new Response("answer", { status: 200 })) as typeof fetch,
      },
    );
  };

  const first = makeClient();
  await first.start({
    clientSecret: "ek_1",
    maxMinutes: 20,
    warningAtMinutes: 18,
  });
  const second = makeClient();
  await assert.rejects(
    () =>
      second.start({
        clientSecret: "ek_2",
        maxMinutes: 20,
        warningAtMinutes: 18,
      }),
    /Hanya satu sesi/,
  );
  first.end();
});

test("mic permission denied surfaces error and cleans session", async () => {
  let ended = false;
  let error = "";
  const client = createRealtimeVoiceClient(
    {
      onError: (message) => {
        error = message;
      },
      onEnded: () => {
        ended = true;
      },
    },
    {
      getUserMedia: async () => {
        throw new Error("Permission denied");
      },
      RTCPeerConnection: FakePeerConnection as unknown as typeof RTCPeerConnection,
    },
  );

  await assert.rejects(
    () =>
      client.start({
        clientSecret: "ek_test",
        maxMinutes: 20,
        warningAtMinutes: 18,
      }),
    /mikrofon/i,
  );
  assert.match(error, /mikrofon/i);
  assert.equal(ended, true);
  assert.equal(hasActiveRealtimeClient(), false);
});

test("end call stops all MediaStream tracks and timers auto-end at max", async () => {
  const localTrack = createFakeTrack();
  const remoteTrack = createFakeTrack();
  let endedReason = "";
  let warned = false;
  const holder: { peer: FakePeerConnection | null } = { peer: null };

  const client = createRealtimeVoiceClient(
    {
      onError: (message) => {
        endedReason = message;
      },
      onWarningNearMax: () => {
        warned = true;
      },
    },
    {
      getUserMedia: async () => createFakeStream([localTrack]),
      RTCPeerConnection: peerFactory(holder),
      createAudioElement: () =>
        ({
          autoplay: true,
          srcObject: null,
          play: async () => undefined,
          pause: () => undefined,
        }) as unknown as HTMLAudioElement,
      fetchImpl: (async () =>
        new Response("answer", { status: 200 })) as typeof fetch,
    },
  );

  await client.start({
    clientSecret: "ek_test",
    maxMinutes: 0.00005,
    warningAtMinutes: 0.00001,
  });

  requirePeer(holder).ontrack?.({
    streams: [createFakeStream([remoteTrack])],
  } as unknown as RTCTrackEvent);

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(warned, true);
  assert.match(endedReason, /Durasi maksimum/);
  assert.equal(localTrack.stopped, true);
  assert.equal(remoteTrack.stopped, true);
  assert.equal(requirePeer(holder).closed, true);
  assert.equal(hasActiveRealtimeClient(), false);
});

test("unmount-style end cleans connection, data channel, audio, and tracks", async () => {
  const localTrack = createFakeTrack();
  const holder: { peer: FakePeerConnection | null } = { peer: null };
  const audio = {
    autoplay: true,
    srcObject: null as MediaStream | null,
    play: async () => undefined,
    pause: () => undefined,
  };

  const client = createRealtimeVoiceClient(
    {},
    {
      getUserMedia: async () => createFakeStream([localTrack]),
      RTCPeerConnection: peerFactory(holder),
      createAudioElement: () => audio as unknown as HTMLAudioElement,
      fetchImpl: (async () =>
        new Response("answer", { status: 200 })) as typeof fetch,
    },
  );

  await client.start({
    clientSecret: "ek_test",
    maxMinutes: 20,
    warningAtMinutes: 18,
  });
  const peer = requirePeer(holder);
  assert.ok(peer.dataChannel);
  client.end();
  assert.equal(peer.closed, true);
  assert.equal(localTrack.stopped, true);
  assert.equal(audio.srcObject, null);
  assert.equal(client.isActive(), false);
});

test("brain switching cannot leak an active session guard after end", async () => {
  const make = () => {
    const holder: { peer: FakePeerConnection | null } = { peer: null };
    return createRealtimeVoiceClient(
      {},
      {
        getUserMedia: async () => createFakeStream([createFakeTrack()]),
        RTCPeerConnection: peerFactory(holder),
        createAudioElement: () =>
          ({
            autoplay: true,
            srcObject: null,
            play: async () => undefined,
            pause: () => undefined,
          }) as unknown as HTMLAudioElement,
        fetchImpl: (async () =>
          new Response("answer", { status: 200 })) as typeof fetch,
      },
    );
  };

  const brainA = make();
  await brainA.start({
    clientSecret: "ek_a",
    maxMinutes: 20,
    warningAtMinutes: 18,
  });
  brainA.end();
  const brainB = make();
  await brainB.start({
    clientSecret: "ek_b",
    maxMinutes: 20,
    warningAtMinutes: 18,
  });
  assert.equal(brainB.isActive(), true);
  brainB.end();
});

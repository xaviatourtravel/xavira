export type AiTeamMemberUiDictionary = {
  eyebrow: string;
  title: string;
  subtitle: string;
  brain: string;
  currentSpeaker: string;
  liveTranscript: string;
  stopListening: string;
  listening: string;
  standby: string;
  roomReady: string;
  roomReadyHint: string;
  draftPlaceholder: string;
  addTranscript: string;
  talkToAi: string;
  askPlaceholder: string;
  askAi: string;
  raiseHand: string;
  searchWeb: string;
  thinking: string;
  searchingLatest: string;
  preparingVoice: string;
  needTranscript: string;
  aiFailed: string;
  responseLabel: string;
  usedBrain: string;
  usedWebSearch: string;
  sources: string;
  summary: string;
  decisions: string;
  actionItems: string;
  unresolved: string;
  memoryApproval: string;
  replayVoice: string;
  muteVoice: string;
  unmuteVoice: string;
  voiceDisclosure: string;
  voiceLoading: string;
  micUnsupported: string;
  voiceCallTitle: string;
  startVoiceCall: string;
  endVoiceCall: string;
  muteMic: string;
  unmuteMic: string;
  callListening: string;
  callThinking: string;
  callSpeaking: string;
  callDisconnected: string;
  callConnecting: string;
  callDuration: string;
  callNearMax: string;
  callEndedMax: string;
  callMicDenied: string;
  callFailed: string;
  callActiveBrainLock: string;
  callRealtimeDisclosure: string;
  selectedBrain: string;
  realtimeTranscriptSource: string;
};

export type AiTeamMemberUiKey = keyof AiTeamMemberUiDictionary;

export const aiTeamMemberUiId: AiTeamMemberUiDictionary = {
  eyebrow: "Ruang inteligensi",
  title: "AI Team Member",
  subtitle:
    "Teman meeting yang mendengar, berpikir, lalu merapikan keputusan dan tindak lanjut.",
  brain: "Brain",
  currentSpeaker: "Pembicara saat ini",
  liveTranscript: "Live transcript",
  stopListening: "Stop listening",
  listening: "Mendengarkan",
  standby: "Standby",
  roomReady: "Meeting room siap",
  roomReadyHint:
    "Pilih speaker lalu nyalakan mic, atau masukkan catatan meeting secara manual.",
  draftPlaceholder: "Tambahkan ucapan atau catatan meeting…",
  addTranscript: "Tambah transcript",
  talkToAi: "Bicara dengan AI",
  askPlaceholder: "Tanya pendapat AI tentang diskusi ini…",
  askAi: "Ask AI",
  raiseHand: "Raise hand",
  searchWeb: "Cari web",
  thinking: "Berpikir…",
  searchingLatest: "Mencari informasi terbaru…",
  preparingVoice: "Menyiapkan suara…",
  needTranscript: "Tambahkan transcript dulu.",
  aiFailed: "AI gagal merespons.",
  responseLabel: "Respons AI",
  usedBrain: "Memakai konteks brain",
  usedWebSearch: "Memakai pencarian web",
  sources: "Sumber",
  summary: "Ringkasan",
  decisions: "Keputusan",
  actionItems: "Tindak lanjut",
  unresolved: "Belum selesai",
  memoryApproval: "Persetujuan memori",
  replayVoice: "Putar ulang",
  muteVoice: "Bisukan suara",
  unmuteVoice: "Nyalakan suara",
  voiceDisclosure: "Suara dihasilkan oleh AI.",
  voiceLoading: "Menyiapkan suara…",
  micUnsupported: "Live transcript tersedia di Chrome atau Edge.",
  voiceCallTitle: "Voice Call",
  startVoiceCall: "Mulai Voice Call",
  endVoiceCall: "Akhiri",
  muteMic: "Bisukan mic",
  unmuteMic: "Nyalakan mic",
  callListening: "Mendengarkan",
  callThinking: "Berpikir",
  callSpeaking: "Berbicara",
  callDisconnected: "Terputus",
  callConnecting: "Menghubungkan…",
  callDuration: "Durasi panggilan",
  callNearMax: "Panggilan hampir mencapai batas waktu.",
  callEndedMax: "Panggilan diakhiri karena batas waktu tercapai.",
  callMicDenied: "Izin mikrofon ditolak atau tidak tersedia.",
  callFailed: "Voice Call gagal terhubung.",
  callActiveBrainLock: "Akhiri Voice Call dulu sebelum mengganti brain.",
  callRealtimeDisclosure: "Suara ini dihasilkan oleh AI.",
  selectedBrain: "Brain aktif",
  realtimeTranscriptSource: "Voice Call",
};

export const aiTeamMemberUiEn: AiTeamMemberUiDictionary = {
  eyebrow: "Intelligence workspace",
  title: "AI Team Member",
  subtitle:
    "A meeting teammate that listens, thinks, then organizes decisions and follow-ups.",
  brain: "Brain",
  currentSpeaker: "Current speaker",
  liveTranscript: "Live transcript",
  stopListening: "Stop listening",
  listening: "Listening",
  standby: "Standby",
  roomReady: "Meeting room ready",
  roomReadyHint:
    "Choose a speaker and turn on the mic, or add meeting notes manually.",
  draftPlaceholder: "Add a spoken line or meeting note…",
  addTranscript: "Add transcript",
  talkToAi: "Talk to AI",
  askPlaceholder: "Ask the AI about this discussion…",
  askAi: "Ask AI",
  raiseHand: "Raise hand",
  searchWeb: "Search web",
  thinking: "Thinking…",
  searchingLatest: "Searching for the latest information…",
  preparingVoice: "Preparing voice…",
  needTranscript: "Add a transcript first.",
  aiFailed: "AI failed to respond.",
  responseLabel: "AI response",
  usedBrain: "Used brain context",
  usedWebSearch: "Used web search",
  sources: "Sources",
  summary: "Summary",
  decisions: "Decisions",
  actionItems: "Action items",
  unresolved: "Unresolved",
  memoryApproval: "Memory approval",
  replayVoice: "Replay",
  muteVoice: "Mute voice",
  unmuteVoice: "Unmute voice",
  voiceDisclosure: "Voice generated by AI.",
  voiceLoading: "Preparing voice…",
  micUnsupported: "Live transcript is available in Chrome or Edge.",
  voiceCallTitle: "Voice Call",
  startVoiceCall: "Start Voice Call",
  endVoiceCall: "End",
  muteMic: "Mute mic",
  unmuteMic: "Unmute mic",
  callListening: "Listening",
  callThinking: "Thinking",
  callSpeaking: "Speaking",
  callDisconnected: "Disconnected",
  callConnecting: "Connecting…",
  callDuration: "Call duration",
  callNearMax: "The call is nearing the time limit.",
  callEndedMax: "The call ended because the time limit was reached.",
  callMicDenied: "Microphone permission was denied or unavailable.",
  callFailed: "Voice Call failed to connect.",
  callActiveBrainLock: "End the Voice Call before switching brains.",
  callRealtimeDisclosure: "This voice is generated by AI.",
  selectedBrain: "Active brain",
  realtimeTranscriptSource: "Voice Call",
};

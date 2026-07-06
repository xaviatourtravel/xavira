import type { Locale } from "@/lib/i18n/config";

export type TestAiDictionary = {
  simulator: string;
  inspector: string;
  savedTests: string;
  customerSimulator: string;
  customerSimulatorDescription: string;
  askPlaceholder: string;
  suggestedQuestions: string;
  conversationScenarios: string;
  send: string;
  sending: string;
  resetConversation: string;
  saveTest: string;
  saving: string;
  aiConfidence: string;
  knowledgeUsed: string;
  memory: string;
  rulesApplied: string;
  suggestedActions: string;
  warnings: string;
  noSavedTests: string;
  noSavedTestsHint: string;
  startConversation: string;
  inspectorTitle: string;
  inspectorSubtitle: string;
  inspectorEmptySubtitle: string;
  inspectorEmptyMessage: string;
  aiThinking: string;
  exampleHint: string;
  llmNotConfigured: string;
  customerMessageRequired: string;
  aiPreviewFailed: string;
  saveFailed: string;
  renameFailed: string;
  deleteConfirm: string;
  replay: string;
  rename: string;
  delete: string;
  cancel: string;
  save: string;
  score: string;
  breakdown: string;
  improveYourAi: string;
  expectedImpact: string;
  noKnowledgeSources: string;
  noRulesApplied: string;
  noSuggestedActions: string;
  noMemory: string;
  aiScore: string;
  overall: string;
  tone: string;
  knowledge: string;
  ruleCompliance: string;
  completeness: string;
  naturalness: string;
  scoreExcellent: string;
  scoreGood: string;
  scoreNeedsImprovement: string;
  scorePoor: string;
  intent: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
};

export type Dictionary = {
  common: {
    language: string;
    appearance: string;
    session: string;
    signOut: string;
    workspaces: string;
    more: string;
    comingSoon: string;
    soon: string;
    saveDraft: string;
    discardChanges: string;
    cancel: string;
    save: string;
  };
  navigation: {
    today: string;
    inbox: string;
    communication: string;
    customers: string;
    sales: string;
    operations: string;
    finance: string;
    performance: string;
    intelligence: string;
    businessBrain: string;
    aiActions: string;
    automation: string;
    insights: string;
    settings: string;
  };
  businessBrain: {
    title: string;
    subtitle: string;
    overview: string;
    overviewDescription: string;
    identity: string;
    identityDescription: string;
    products: string;
    productsDescription: string;
    knowledge: string;
    knowledgeDescription: string;
    documents: string;
    documentsDescription: string;
    rules: string;
    rulesDescription: string;
    testAi: string;
    testAiDescription: string;
    publish: string;
    publishPageTitle: string;
    publishDescription: string;
    publishButton: string;
    aiPermissions: string;
    aiPermissionsDescription: string;
    health: string;
    aiReadinessScore: string;
    expectedAiResponseQuality: string;
    sectionScores: string;
    sectionScoresDescription: string;
    recommendedActions: string;
    recommendedActionsDescription: string;
    recommendedActionsHint: string;
    wellCovered: string;
    wellCoveredDescription: string;
    needsImprovement: string;
    needsImprovementDescription: string;
    allRecommendations: string;
    allRecommendationsDescription: string;
    recentActivity: string;
    recentActivityDescription: string;
    recommendedImprovements: string;
    scoresFooter: string;
    noActivityYet: string;
    noActivityDescription: string;
    wellCoveredEmpty: string;
    needsImprovementEmpty: string;
    readyTitle: string;
    readyDescription: string;
    coachTitle: string;
    coachDescription: string;
    coachProgress: string;
    coachCompleted: string;
    coachMissing: string;
    coachReadyTitle: string;
    coachReadyDescription: string;
    openTestAi: string;
    priorityCritical: string;
    priorityRecommended: string;
    priorityOptional: string;
    publishStatus: string;
    currentStatus: string;
    lastPublishedAt: string;
    lastPublishedBy: string;
    draftChangesCount: string;
    changeSummary: string;
    changeSummaryDescription: string;
    preview: string;
    previewInTestAi: string;
    noUnpublishedChanges: string;
    versionHistory: string;
    versionHistoryDescription: string;
    noVersionsYet: string;
    version: string;
    publishedAt: string;
    publishedBy: string;
    status: string;
    published: string;
    draft: string;
    active: string;
    superseded: string;
    section: string;
    added: string;
    edited: string;
    removed: string;
    publishFailed: string;
    adminOnlyPublish: string;
    changeSummaryEmpty: string;
    knowledgeCoverage: string;
    weakestCoverage: string;
    permissionsReadOnly: string;
    coachDifficulty: string;
    coachTime: string;
    knowledgeCoverageDescription: string;
    updating: string;
    overall: string;
    categories: string;
  };
  testAi: TestAiDictionary;
  inbox: Record<string, never>;
  ai: Record<string, never>;
};

const testAiId: TestAiDictionary = {
  simulator: "Simulator",
  inspector: "Inspektor",
  savedTests: "Tes Tersimpan",
  customerSimulator: "Simulator Customer",
  customerSimulatorDescription: "Tanyakan pertanyaan seperti customer di WhatsApp.",
  askPlaceholder: "Tanyakan sesuatu seperti customer...",
  suggestedQuestions: "Contoh Pertanyaan",
  conversationScenarios: "Skenario Percakapan",
  send: "Kirim",
  sending: "Mengirim…",
  resetConversation: "Reset Percakapan",
  saveTest: "Simpan Tes",
  saving: "Menyimpan…",
  aiConfidence: "Kepercayaan AI",
  knowledgeUsed: "Knowledge yang Dipakai",
  memory: "Memori",
  rulesApplied: "Rules yang Diterapkan",
  suggestedActions: "Rekomendasi Aksi",
  warnings: "Peringatan",
  noSavedTests: "Belum ada tes tersimpan",
  noSavedTestsHint: "Simpan percakapan berhasil untuk membangun library tes AI Anda.",
  startConversation: "Mulai percakapan untuk menguji AI kamu",
  inspectorTitle: "Inspektor AI",
  inspectorSubtitle: "Mengapa AI menjawab seperti itu.",
  inspectorEmptySubtitle: "Kirim pesan uji untuk melihat reasoning AI.",
  inspectorEmptyMessage:
    "Belum ada data. Ajukan pertanyaan customer untuk melihat kepercayaan, knowledge, memori, dan rules di balik respons.",
  aiThinking: "AI sedang berpikir…",
  exampleHint: "Contoh: Apakah ada paket Jepang untuk Oktober?",
  llmNotConfigured:
    "Preview AI tidak tersedia. Tambahkan OPENAI_API_KEY untuk menguji respons.",
  customerMessageRequired: "Pesan customer wajib diisi.",
  aiPreviewFailed: "Preview AI gagal. Silakan coba lagi.",
  saveFailed: "Gagal menyimpan tes.",
  renameFailed: "Gagal mengubah nama.",
  deleteConfirm: "Hapus tes tersimpan ini?",
  replay: "Putar Ulang",
  rename: "Ubah Nama",
  delete: "Hapus",
  cancel: "Batal",
  save: "Simpan",
  score: "Skor",
  breakdown: "Rincian",
  improveYourAi: "Tingkatkan AI Anda",
  expectedImpact: "Dampak yang Diharapkan",
  noKnowledgeSources: "Tidak ada sumber knowledge yang dirujuk untuk respons ini.",
  noRulesApplied: "Tidak ada rules yang diterapkan untuk respons ini.",
  noSuggestedActions: "Tidak ada aksi lanjutan yang disarankan untuk respons ini.",
  noMemory: "Belum ada memori customer yang diekstrak dari percakapan ini.",
  aiScore: "Skor AI",
  overall: "Keseluruhan",
  tone: "Nada",
  knowledge: "Knowledge",
  ruleCompliance: "Kepatuhan Rules",
  completeness: "Kelengkapan",
  naturalness: "Naturalitas",
  scoreExcellent: "Sangat Baik",
  scoreGood: "Baik",
  scoreNeedsImprovement: "Perlu Perbaikan",
  scorePoor: "Buruk",
  intent: "Intent",
  justNow: "Baru saja",
  minutesAgo: "{count}m lalu",
  hoursAgo: "{count}j lalu",
  daysAgo: "{count}h lalu",
};

const testAiEn: TestAiDictionary = {
  simulator: "Simulator",
  inspector: "Inspector",
  savedTests: "Saved Tests",
  customerSimulator: "Customer Simulator",
  customerSimulatorDescription: "Ask questions the way your customers would on WhatsApp.",
  askPlaceholder: "Ask something like a customer...",
  suggestedQuestions: "Suggested Questions",
  conversationScenarios: "Conversation Scenarios",
  send: "Send",
  sending: "Sending…",
  resetConversation: "Reset Conversation",
  saveTest: "Save Test",
  saving: "Saving…",
  aiConfidence: "AI Confidence",
  knowledgeUsed: "Knowledge Used",
  memory: "Memory",
  rulesApplied: "Rules Applied",
  suggestedActions: "Suggested Actions",
  warnings: "Warnings",
  noSavedTests: "No saved tests yet",
  noSavedTestsHint: "Save successful conversations to build your AI test library.",
  startConversation: "Start a conversation to test your AI",
  inspectorTitle: "AI Inspector",
  inspectorSubtitle: "Why the AI answered the way it did.",
  inspectorEmptySubtitle: "Send a test message to inspect the AI reasoning.",
  inspectorEmptyMessage:
    "Nothing here yet. Ask a customer question to see confidence, knowledge, memory, and rules behind the response.",
  aiThinking: "AI is thinking…",
  exampleHint: "Example: Do you have a Japan package for October?",
  llmNotConfigured:
    "AI preview is not available. Add OPENAI_API_KEY to enable response testing.",
  customerMessageRequired: "Customer message is required.",
  aiPreviewFailed: "AI preview failed. Please try again.",
  saveFailed: "Failed to save test.",
  renameFailed: "Rename failed.",
  deleteConfirm: "Delete this saved test?",
  replay: "Replay",
  rename: "Rename",
  delete: "Delete",
  cancel: "Cancel",
  save: "Save",
  score: "Score",
  breakdown: "Breakdown",
  improveYourAi: "Improve Your AI",
  expectedImpact: "Expected Impact",
  noKnowledgeSources: "No knowledge sources were referenced for this response.",
  noRulesApplied: "No behavior rules were applied for this response.",
  noSuggestedActions: "No follow-up actions were suggested for this response.",
  noMemory: "No customer memory was extracted from this conversation yet.",
  aiScore: "AI Score",
  overall: "Overall",
  tone: "Tone",
  knowledge: "Knowledge",
  ruleCompliance: "Rule Compliance",
  completeness: "Completeness",
  naturalness: "Naturalness",
  scoreExcellent: "Excellent",
  scoreGood: "Good",
  scoreNeedsImprovement: "Needs Improvement",
  scorePoor: "Poor",
  intent: "Intent",
  justNow: "Just now",
  minutesAgo: "{count}m ago",
  hoursAgo: "{count}h ago",
  daysAgo: "{count}d ago",
};

const id: Dictionary = {
  common: {
    language: "Bahasa",
    appearance: "Tampilan",
    session: "Sesi",
    signOut: "Keluar",
    workspaces: "Ruang Kerja",
    more: "Lainnya",
    comingSoon: "Segera",
    soon: "Segera",
    saveDraft: "Simpan Draft",
    discardChanges: "Buang Perubahan",
    cancel: "Batal",
    save: "Simpan",
  },
  navigation: {
    today: "Hari Ini",
    inbox: "Kotak Masuk",
    communication: "Komunikasi",
    customers: "Pelanggan",
    sales: "Penjualan",
    operations: "Operasional",
    finance: "Keuangan",
    performance: "Performa",
    intelligence: "Inteligensi",
    businessBrain: "Business Brain",
    aiActions: "Aksi AI",
    automation: "Otomatisasi",
    insights: "Wawasan",
    settings: "Pengaturan",
  },
  businessBrain: {
    title: "Business Brain",
    subtitle: "Ajari bisnis Anda. Biarkan AI mengerjakan sisanya.",
    overview: "Ringkasan",
    overviewDescription:
      "Ukur seberapa siap AI Anda membantu pelanggan dengan akurat.",
    identity: "Identitas",
    identityDescription:
      "Tentukan suara brand, tujuan, dan batasan yang harus dihormati AI.",
    products: "Produk",
    productsDescription: "Kelola produk dan layanan yang dikenali AI.",
    knowledge: "Pengetahuan",
    knowledgeDescription: "Artikel dan FAQ yang AI gunakan saat merespons.",
    documents: "Dokumen",
    documentsDescription: "Dokumen yang dapat dikirim AI ke pelanggan.",
    rules: "Aturan",
    rulesDescription: "Aturan perilaku dan gaya balasan AI.",
    testAi: "Uji AI",
    testAiDescription:
      "Jika pelanggan nyata bertanya ini, bagaimana AI Anda akan merespons?",
    publish: "Terbitkan",
    publishPageTitle: "Terbitkan Business Brain",
    publishDescription:
      "Tinjau perubahan draft sebelum aktif di percakapan pelanggan.",
    publishButton: "Terbitkan Business Brain",
    aiPermissions: "Izin AI",
    aiPermissionsDescription: "Kontrol aksi AI yang diizinkan di workspace.",
    health: "Kesehatan Business Brain",
    aiReadinessScore: "Skor Kesiapan AI",
    expectedAiResponseQuality: "Kualitas Respons AI yang Diharapkan",
    sectionScores: "Skor per Bagian",
    sectionScoresDescription: "Kontribusi setiap area terhadap kesiapan AI.",
    recommendedActions: "Rekomendasi Aksi",
    recommendedActionsDescription:
      "Perbaikan berdampak tinggi berdasarkan konfigurasi saat ini.",
    recommendedActionsHint: "Selesaikan ini dulu untuk peningkatan tercepat.",
    wellCovered: "Sudah Baik",
    wellCoveredDescription: "Area di mana AI sudah punya konteks kuat.",
    needsImprovement: "Perlu Perbaikan",
    needsImprovementDescription: "Celah yang dapat memengaruhi kualitas respons.",
    allRecommendations: "Semua Rekomendasi",
    allRecommendationsDescription:
      "Rekomendasi perbaikan berdasarkan Business Brain saat ini.",
    recentActivity: "Aktivitas Terbaru",
    recentActivityDescription: "Pembaruan terbaru Business Brain Anda.",
    recommendedImprovements: "Rekomendasi Perbaikan",
    scoresFooter:
      "Skor mencerminkan Identitas, Produk, Pengetahuan, Dokumen, dan Aturan terbaru. Dihitung lokal — tanpa panggilan AI.",
    noActivityYet: "Belum ada aktivitas.",
    noActivityDescription: "Pembaruan Business Brain terbaru akan muncul di sini.",
    wellCoveredEmpty: "Belum ada. Lengkapi Identitas untuk fondasi Anda.",
    needsImprovementEmpty: "Tidak ada celah signifikan pada konfigurasi saat ini.",
    readyTitle: "Business Brain Anda siap untuk pelanggan.",
    readyDescription:
      "AI Anda memiliki konteks cukup untuk merespons akurat di percakapan live.",
    coachTitle: "Pelatih Business Brain",
    coachDescription: "Rekomendasi untuk meningkatkan AI berdasarkan setup saat ini.",
    coachProgress: "Progres Business Brain",
    coachCompleted: "Sudah selesai",
    coachMissing: "Masih kurang",
    coachReadyTitle: "Business Brain sudah siap.",
    coachReadyDescription:
      "AI Anda memiliki knowledge terstruktur cukup untuk mulai membantu pelanggan.",
    openTestAi: "Buka Uji AI",
    priorityCritical: "Kritis",
    priorityRecommended: "Direkomendasikan",
    priorityOptional: "Opsional",
    publishStatus: "Status Terbit",
    currentStatus: "Status Saat Ini",
    lastPublishedAt: "Terakhir Diterbitkan",
    lastPublishedBy: "Diterbitkan Oleh",
    draftChangesCount: "Jumlah Perubahan Draft",
    changeSummary: "Ringkasan Perubahan",
    changeSummaryDescription: "Edit yang belum diterbitkan dibanding versi terakhir.",
    preview: "Pratinjau",
    previewInTestAi: "Pratinjau di Uji AI",
    noUnpublishedChanges:
      "Tidak ada perubahan yang belum diterbitkan. Edit modul Business Brain untuk membuat draft baru.",
    versionHistory: "Riwayat Versi",
    versionHistoryDescription: "Snapshot yang diterbitkan. Rollback belum tersedia.",
    noVersionsYet:
      "Belum ada versi. Terbitkan versi pertama untuk melacak perubahan dari waktu ke waktu.",
    version: "Versi",
    publishedAt: "Diterbitkan Pada",
    publishedBy: "Diterbitkan Oleh",
    status: "Status",
    published: "Diterbitkan",
    draft: "Draft",
    active: "Aktif",
    superseded: "Digantikan",
    section: "Bagian",
    added: "Ditambah",
    edited: "Diedit",
    removed: "Dihapus",
    publishFailed: "Gagal menerbitkan.",
    adminOnlyPublish: "Hanya admin dan owner yang dapat menerbitkan perubahan.",
    changeSummaryEmpty:
      "Belum ada data. Tambahkan Identitas, Produk, atau Pengetahuan sebelum menerbitkan.",
    knowledgeCoverage: "Cakupan Pengetahuan",
    weakestCoverage: "Cakupan Terlemah",
    permissionsReadOnly: "Hanya owner dan admin workspace yang dapat mengubah izin AI.",
    coachDifficulty: "Kesulitan",
    coachTime: "Waktu",
    knowledgeCoverageDescription:
      "Lihat di mana AI punya konteks kuat dan di mana cakupannya masih tipis.",
    updating: "Memperbarui",
    overall: "Keseluruhan",
    categories: "Kategori",
  },
  testAi: testAiId,
  inbox: {},
  ai: {},
};

const en: Dictionary = {
  common: {
    language: "Language",
    appearance: "Appearance",
    session: "Session",
    signOut: "Sign out",
    workspaces: "Workspaces",
    more: "More",
    comingSoon: "Coming soon",
    soon: "Soon",
    saveDraft: "Save Draft",
    discardChanges: "Discard Changes",
    cancel: "Cancel",
    save: "Save",
  },
  navigation: {
    today: "Today",
    inbox: "Inbox",
    communication: "Communication",
    customers: "Customers",
    sales: "Sales",
    operations: "Operations",
    finance: "Finance",
    performance: "Performance",
    intelligence: "Intelligence",
    businessBrain: "Business Brain",
    aiActions: "AI Actions",
    automation: "Automation",
    insights: "Insights",
    settings: "Settings",
  },
  businessBrain: {
    title: "Business Brain",
    subtitle: "Teach your business. Let AI do the rest.",
    overview: "Overview",
    overviewDescription: "Measure how prepared your AI is to assist customers accurately.",
    identity: "Identity",
    identityDescription:
      "Define your brand voice, goals, and the boundaries your AI should respect.",
    products: "Products",
    productsDescription: "Manage the products and services your AI recognizes.",
    knowledge: "Knowledge",
    knowledgeDescription: "Articles and FAQs your AI uses when responding.",
    documents: "Documents",
    documentsDescription: "Documents your AI can send to customers.",
    rules: "Rules",
    rulesDescription: "Behavior rules and AI reply style.",
    testAi: "Test AI",
    testAiDescription: "If a real customer asked this, how would your AI respond?",
    publish: "Publish",
    publishPageTitle: "Publish Business Brain",
    publishDescription: "Review draft changes before they go live in customer conversations.",
    publishButton: "Publish Business Brain",
    aiPermissions: "AI Permissions",
    aiPermissionsDescription: "Control which AI actions are allowed in your workspace.",
    health: "Business Brain Health",
    aiReadinessScore: "AI Readiness Score",
    expectedAiResponseQuality: "Expected AI Response Quality",
    sectionScores: "Section Scores",
    sectionScoresDescription: "How each area contributes to overall readiness.",
    recommendedActions: "Recommended Actions",
    recommendedActionsDescription:
      "Highest-impact improvements based on your current configuration.",
    recommendedActionsHint: "Address these first for the fastest improvement.",
    wellCovered: "Well Covered",
    wellCoveredDescription: "Areas where your AI already has strong context.",
    needsImprovement: "Needs Improvement",
    needsImprovementDescription: "Gaps that may affect response quality until addressed.",
    allRecommendations: "All Recommendations",
    allRecommendationsDescription:
      "Recommended improvements based on your current Business Brain.",
    recentActivity: "Recent Activity",
    recentActivityDescription: "Recent updates to your Business Brain.",
    recommendedImprovements: "Recommended Improvements",
    scoresFooter:
      "Scores reflect your latest Identity, Products, Knowledge, Documents, and Rules. Calculated locally — no AI calls.",
    noActivityYet: "No activity yet.",
    noActivityDescription: "Your recent Business Brain updates will appear here.",
    wellCoveredEmpty: "Nothing here yet. Complete Identity to establish your foundation.",
    needsImprovementEmpty: "No significant gaps detected in your current configuration.",
    readyTitle: "Your Business Brain is ready for customers.",
    readyDescription:
      "Your AI has sufficient context to respond accurately in live conversations.",
    coachTitle: "Business Brain Coach",
    coachDescription: "Recommendations to improve your AI based on your current setup.",
    coachProgress: "Business Brain Progress",
    coachCompleted: "You have completed",
    coachMissing: "Still missing",
    coachReadyTitle: "Business Brain is ready.",
    coachReadyDescription:
      "Your AI has enough structured knowledge to begin assisting customers.",
    openTestAi: "Open Test AI",
    priorityCritical: "Critical",
    priorityRecommended: "Recommended",
    priorityOptional: "Optional",
    publishStatus: "Publish Status",
    currentStatus: "Current Status",
    lastPublishedAt: "Last Published At",
    lastPublishedBy: "Last Published By",
    draftChangesCount: "Draft Changes Count",
    changeSummary: "Change Summary",
    changeSummaryDescription: "Unpublished edits compared to the last published version.",
    preview: "Preview",
    previewInTestAi: "Preview in Test AI",
    noUnpublishedChanges:
      "No unpublished changes. Edit Business Brain modules to create a new draft.",
    versionHistory: "Version History",
    versionHistoryDescription: "Published snapshots. Rollback is not available yet.",
    noVersionsYet: "Nothing here yet. Publish your first version to track changes over time.",
    version: "Version",
    publishedAt: "Published At",
    publishedBy: "Published By",
    status: "Status",
    published: "Published",
    draft: "Draft",
    active: "Active",
    superseded: "Superseded",
    section: "Section",
    added: "Added",
    edited: "Edited",
    removed: "Removed",
    publishFailed: "Publish failed.",
    adminOnlyPublish: "Only admins and owners can publish changes.",
    changeSummaryEmpty:
      "Nothing here yet. Add Identity, Products, or Knowledge before publishing.",
    knowledgeCoverage: "Knowledge Coverage",
    weakestCoverage: "Weakest Coverage",
    permissionsReadOnly: "Only workspace owners and admins can change AI permissions.",
    coachDifficulty: "Difficulty",
    coachTime: "Time",
    knowledgeCoverageDescription:
      "See where your AI has strong context and where coverage is still thin.",
    updating: "Updating",
    overall: "Overall",
    categories: "Categories",
  },
  testAi: testAiEn,
  inbox: {},
  ai: {},
};

export const dictionaries: Record<Locale, Dictionary> = { id, en };

export type TranslationKey =
  | `common.${keyof Dictionary["common"]}`
  | `navigation.${keyof Dictionary["navigation"]}`
  | `businessBrain.${keyof Dictionary["businessBrain"]}`
  | `testAi.${keyof TestAiDictionary}`
  | `inbox.${string}`
  | `ai.${string}`;

export type TranslateFn = (key: TranslationKey | string) => string;

export type StrictTranslateFn = (key: TranslationKey | string) => string;

function resolveDictionaryValue(dictionary: Dictionary, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = dictionary;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function createTranslator(locale: Locale): TranslateFn {
  const dictionary = dictionaries[locale];

  return (key: string) => {
    const value = resolveDictionaryValue(dictionary, key);
    return value ?? key;
  };
}

export function createStrictTranslator(locale: Locale): StrictTranslateFn {
  const dictionary = dictionaries[locale];

  return (key: string) => {
    const value = resolveDictionaryValue(dictionary, key);
    if (value === undefined && process.env.NODE_ENV === "development") {
      console.warn(`[i18n] Missing translation key: ${key}`);
    }
    return value ?? key;
  };
}

export function formatTranslation(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replace(`{${name}}`, String(value)),
    template,
  );
}

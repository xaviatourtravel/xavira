import { Sparkles } from "lucide-react";

import type { KnowledgeFaqItem } from "@/lib/knowledge/ai";

type KnowledgeAiOutputProps = {
  aiStatus: string;
  summary: string | null;
  keyPoints: string[];
  faq: KnowledgeFaqItem[];
};

export function KnowledgeAiOutput({
  aiStatus,
  summary,
  keyPoints,
  faq,
}: KnowledgeAiOutputProps) {
  if (aiStatus === "processing") {
    return (
      <div className="rounded-xl border bg-amber-50/50 p-6 text-sm text-amber-700">
        AI sedang memproses dokumen ini. Muat ulang halaman sebentar lagi.
      </div>
    );
  }

  if (aiStatus === "failed") {
    return (
      <div className="rounded-xl border bg-red-50/50 p-6 text-sm text-red-600">
        AI gagal memproses konten ini. Gunakan tombol &quot;Proses ulang AI&quot;
        untuk mencoba lagi.
      </div>
    );
  }

  if (aiStatus !== "completed" || (!summary && keyPoints.length === 0 && faq.length === 0)) {
    return (
      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        Belum ada hasil AI. Gunakan tombol &quot;Proses ulang AI&quot; untuk
        menghasilkan ringkasan, poin penting, dan FAQ.
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">AI Knowledge</h2>
      </div>

      {summary ? (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">Ringkasan</h3>
          <p className="mt-1 text-sm leading-relaxed">{summary}</p>
        </div>
      ) : null}

      {keyPoints.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">
            Poin Penting
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {keyPoints.map((point, index) => (
              <li key={`${index}-${point.slice(0, 12)}`}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {faq.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">FAQ</h3>
          <dl className="mt-2 space-y-3">
            {faq.map((item, index) => (
              <div key={`${index}-${item.question.slice(0, 12)}`}>
                <dt className="text-sm font-medium">{item.question}</dt>
                <dd className="mt-0.5 text-sm text-muted-foreground">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

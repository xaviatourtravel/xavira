import { ContentCopyButton } from "@/components/content/content-copy-button";
import {
  AI_CONTENT_SECTION_LABELS,
  type AiContentSections,
} from "@/lib/content/ai-sections";

type ContentAiSectionsDisplayProps = {
  sections: AiContentSections;
};

function SectionBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ContentCopyButton text={content} />
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
        {content}
      </pre>
    </section>
  );
}

export function ContentAiSectionsDisplay({
  sections,
}: ContentAiSectionsDisplayProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">AI Generated Content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Konten lengkap dari AI Content Studio.
        </p>
      </div>

      {AI_CONTENT_SECTION_LABELS.map(({ key, label }) => (
        <SectionBlock key={key} title={label} content={sections[key]} />
      ))}
    </div>
  );
}

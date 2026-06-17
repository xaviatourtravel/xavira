import { AI_CONTENT_SECTION_LABELS } from "@/lib/content/ai-sections";

type ContentAiFormFieldsProps = {
  defaultValues: {
    hooks: string;
    voScript: string;
    caption: string;
    cta: string;
    thumbnailConcept: string;
    imagePrompt: string;
  };
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

const fieldConfig: ReadonlyArray<{
  name: string;
  label: string;
  rows: number;
  placeholder: string;
}> = [
  {
    name: "ai_hooks",
    label: "Hook",
    rows: 4,
    placeholder: "Satu hook per baris",
  },
  {
    name: "ai_vo_script",
    label: "VO Script",
    rows: 8,
    placeholder: "Naskah VO lengkap",
  },
  {
    name: "ai_caption",
    label: "Caption",
    rows: 6,
    placeholder: "Caption postingan",
  },
  {
    name: "ai_cta",
    label: "CTA",
    rows: 2,
    placeholder: "Call to action",
  },
  {
    name: "ai_thumbnail_concept",
    label: "Thumbnail Concept",
    rows: 4,
    placeholder: "Konsep thumbnail/visual cover",
  },
  {
    name: "ai_image_prompt",
    label: "Image Prompt",
    rows: 4,
    placeholder: "Prompt untuk generate gambar",
  },
];

export function ContentAiFormFields({
  defaultValues,
}: ContentAiFormFieldsProps) {
  const valuesByName: Record<string, string> = {
    ai_hooks: defaultValues.hooks,
    ai_vo_script: defaultValues.voScript,
    ai_caption: defaultValues.caption,
    ai_cta: defaultValues.cta,
    ai_thumbnail_concept: defaultValues.thumbnailConcept,
    ai_image_prompt: defaultValues.imagePrompt,
  };

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <div>
        <h2 className="text-sm font-semibold">AI Generated Content</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Perubahan disimpan ke generation source tanpa duplikasi ke Notes.
        </p>
      </div>

      {fieldConfig.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
          </label>
          {field.rows <= 2 ? (
            <input
              id={field.name}
              name={field.name}
              defaultValue={valuesByName[field.name]}
              className={inputClassName}
              placeholder={field.placeholder}
            />
          ) : (
            <textarea
              id={field.name}
              name={field.name}
              rows={field.rows}
              defaultValue={valuesByName[field.name]}
              className={inputClassName}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}

      <p className="text-xs text-muted-foreground">
        {AI_CONTENT_SECTION_LABELS.map((section) => section.label).join(" · ")}
      </p>
    </div>
  );
}

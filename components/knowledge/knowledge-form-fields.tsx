import {
  KNOWLEDGE_CATEGORY_OPTIONS,
  KNOWLEDGE_FILE_ACCEPT,
  type KnowledgeCategory,
} from "@/lib/knowledge/constants";

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

type KnowledgeFormFieldsProps = {
  defaultValues?: {
    title?: string;
    category?: KnowledgeCategory;
    tags?: string;
    content?: string;
  };
  showFileUpload?: boolean;
  contentRequired?: boolean;
};

export function KnowledgeFormFields({
  defaultValues,
  showFileUpload = false,
  contentRequired = false,
}: KnowledgeFormFieldsProps) {
  return (
    <>
      <div>
        <label className="text-sm font-medium" htmlFor="knowledge-title">
          Judul *
        </label>
        <input
          id="knowledge-title"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          className={inputClassName}
          placeholder="Contoh: SOP Handover Lead ke Tim Sales"
        />
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="knowledge-category">
          Kategori *
        </label>
        <select
          id="knowledge-category"
          name="category"
          defaultValue={defaultValues?.category ?? "product_knowledge"}
          className={inputClassName}
        >
          {KNOWLEDGE_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="knowledge-tags">
          Tags
        </label>
        <input
          id="knowledge-tags"
          name="tags"
          defaultValue={defaultValues?.tags ?? ""}
          className={inputClassName}
          placeholder="Pisahkan dengan koma, mis: umroh, harga, refund"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Gunakan tags untuk memudahkan pencarian dan filter.
        </p>
      </div>

      {showFileUpload ? (
        <div>
          <label className="text-sm font-medium" htmlFor="knowledge-file">
            Unggah Dokumen (opsional)
          </label>
          <input
            id="knowledge-file"
            type="file"
            name="file"
            accept={KNOWLEDGE_FILE_ACCEPT}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Mendukung PDF, DOCX, atau TXT (maks 20MB). Teks akan diekstrak otomatis
            dan diproses AI.
          </p>
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium" htmlFor="knowledge-content">
          Konten {contentRequired ? "*" : showFileUpload ? "(opsional jika unggah file)" : ""}
        </label>
        <textarea
          id="knowledge-content"
          name="content"
          required={contentRequired}
          defaultValue={defaultValues?.content ?? ""}
          rows={showFileUpload ? 8 : 14}
          className={inputClassName}
          placeholder="Tulis isi knowledge di sini, atau biarkan kosong jika hanya mengunggah dokumen."
        />
      </div>
    </>
  );
}

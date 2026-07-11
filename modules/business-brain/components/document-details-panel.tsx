"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ExternalLink, Save, Trash2, X } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import {
  DsField,
  DsSelect,
  DsTextInput,
  DsTextarea,
} from "@/components/design-system/form-controls";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbDisplayDocumentName,
  bbDocumentStatusLabel,
  bbDocumentTriggerLabel,
  bbDocumentTypeLabel,
  bbRemoveItemLabel,
} from "@/modules/business-brain/lib/bb-ui-labels";
import {
  deleteBrainDocumentAction,
  updateBrainDocumentAction,
} from "@/modules/business-brain/actions/document-actions";
import {
  BRAIN_DOCUMENT_STATUSES,
  BRAIN_DOCUMENT_TRIGGERS,
  BRAIN_DOCUMENT_TYPES,
  formatFileSize,
  type BrainDocumentDetail,
  type BrainDocumentFormValues,
  type BrainDocumentTrigger,
} from "@/modules/business-brain/types/documents";
import { cn } from "@/lib/utils";

type ProductOption = { id: string; name: string };
type ArticleOption = { id: string; title: string };

type DocumentDetailsPanelProps = {
  document: BrainDocumentDetail;
  productOptions: ProductOption[];
  articleOptions: ArticleOption[];
  canEdit: boolean;
  onBack?: () => void;
  onDocumentUpdated: (document: BrainDocumentDetail) => void;
  onDocumentDeleted: (documentId: string) => void;
};

function valuesFromDocument(document: BrainDocumentDetail): BrainDocumentFormValues {
  return {
    name: document.name,
    description: document.description,
    documentType: document.documentType,
    tags: document.tags,
    relatedProductIds: document.relatedProductIds,
    relatedArticleIds: document.relatedArticleIds,
    autoSendEnabled: document.autoSendEnabled,
    triggers: document.triggers,
    aiNotes: document.aiNotes,
    status: document.status,
  };
}

function TagInput({
  value,
  onChange,
  disabled,
  addTagLabel,
  addButtonLabel,
  removeItemLabel,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  addTagLabel: string;
  addButtonLabel: string;
  removeItemLabel: (item: string) => string;
}) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <DsTextInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={addTagLabel}
          disabled={disabled}
        />
        <DsButton type="button" variant="outline" onClick={addTag} disabled={disabled}>
          {addButtonLabel}
        </DsButton>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
            >
              {tag}
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== tag))}
                  className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={removeItemLabel(tag)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DocumentPreview({ document }: { document: BrainDocumentDetail }) {
  const { bb } = useBbTranslation();
  const uploadDate = new Date(document.createdAt).toLocaleString();

  return (
    <DsCard title={bb("preview")}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
          {document.documentType === "image" && document.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={document.previewUrl}
              alt={bbDisplayDocumentName(bb, document.name)}
              className="max-h-72 w-full object-contain"
            />
          ) : document.documentType === "video" && document.previewUrl ? (
            <video
              src={document.previewUrl}
              controls
              className="max-h-72 w-full bg-black"
            />
          ) : document.documentType === "pdf" && document.previewUrl ? (
            <iframe
              src={document.previewUrl}
              title={bbDisplayDocumentName(bb, document.name)}
              className="h-72 w-full"
            />
          ) : document.documentType === "url" && document.publicUrl ? (
            <div className="flex items-center justify-between gap-3 p-4">
              <p className="truncate text-sm text-muted-foreground">{document.publicUrl}</p>
              <a
                href={document.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {bb("open")} <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {bb("previewUnavailable")}
            </div>
          )}
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{bb("fileSize")}</dt>
            <dd className="font-medium text-foreground">
              {formatFileSize(document.fileSize)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{bb("uploadDate")}</dt>
            <dd className="font-medium text-foreground">{uploadDate}</dd>
          </div>
        </dl>
      </div>
    </DsCard>
  );
}

export function DocumentDetailsPanel({
  document,
  productOptions,
  articleOptions,
  canEdit,
  onBack,
  onDocumentUpdated,
  onDocumentDeleted,
}: DocumentDetailsPanelProps) {
  const { bb } = useBbTranslation();
  const [savedValues, setSavedValues] = useState(() => valuesFromDocument(document));
  const [values, setValues] = useState(savedValues);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );

  const updateValues = (patch: Partial<BrainDocumentFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const syncDocument = (next: BrainDocumentDetail) => {
    const nextValues = valuesFromDocument(next);
    setSavedValues(nextValues);
    setValues(nextValues);
    onDocumentUpdated(next);
  };

  const toggleTrigger = (trigger: BrainDocumentTrigger) => {
    const selected = values.triggers.includes(trigger);
    updateValues({
      triggers: selected
        ? values.triggers.filter((item) => item !== trigger)
        : [...values.triggers, trigger],
    });
  };

  const toggleProduct = (productId: string) => {
    const selected = values.relatedProductIds.includes(productId);
    updateValues({
      relatedProductIds: selected
        ? values.relatedProductIds.filter((id) => id !== productId)
        : [...values.relatedProductIds, productId],
    });
  };

  const toggleArticle = (articleId: string) => {
    const selected = values.relatedArticleIds.includes(articleId);
    updateValues({
      relatedArticleIds: selected
        ? values.relatedArticleIds.filter((id) => id !== articleId)
        : [...values.relatedArticleIds, articleId],
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBrainDocumentAction(document.id, values);
      if (!result.ok || !result.document) {
        setErrorMessage(result.ok ? bb("documentNotFound") : result.error);
        return;
      }
      syncDocument(result.document);
      setStatusMessage(bb("draftSaved"));
    });
  };

  const handleDelete = () => {
    if (!window.confirm(bb("deleteDocumentConfirm"))) return;

    startTransition(async () => {
      const result = await deleteBrainDocumentAction(document.id);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      onDocumentDeleted(document.id);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack ? (
            <DsButton type="button" variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              {bb("back")}
            </DsButton>
          ) : null}
          <div>
            <h2 className="text-lg font-semibold text-foreground">{bb("documentDetails")}</h2>
            <p className="text-sm text-muted-foreground">
              {bb("documentDetailsDescription")}
            </p>
          </div>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <DsButton
              type="button"
              variant="outline"
              onClick={() => {
                setValues(savedValues);
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              disabled={!isDirty || isPending}
            >
              {bb("discard")}
            </DsButton>
            <DsButton type="button" onClick={handleSave} loading={isPending} disabled={!isDirty}>
              <Save className="h-4 w-4" />
              {bb("saveDraft")}
            </DsButton>
            <DsButton type="button" variant="outline" onClick={handleDelete} loading={isPending}>
              <Trash2 className="h-4 w-4" />
              {bb("delete")}
            </DsButton>
          </div>
        ) : null}
      </div>

      {statusMessage ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{statusMessage}</p>
      ) : null}
      {canEdit ? (
        <p className="text-xs text-muted-foreground">{bb("globalPublishRequired")}</p>
      ) : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <DocumentPreview document={document} />

      <div className="space-y-4">
        <DsCard title={bb("details")}>
          <div className="grid gap-4 md:grid-cols-2">
            <DsField label={bb("name")}>
              <DsTextInput
                value={values.name}
                onChange={(event) => updateValues({ name: event.target.value })}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("documentType")}>
              <DsSelect
                value={values.documentType}
                onChange={(event) =>
                  updateValues({
                    documentType: event.target.value as BrainDocumentFormValues["documentType"],
                  })
                }
                disabled={!canEdit || document.documentType !== "url"}
              >
                {BRAIN_DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {bbDocumentTypeLabel(bb, type)}
                  </option>
                ))}
              </DsSelect>
            </DsField>
            <div className="md:col-span-2">
              <DsField label={bb("description")}>
                <DsTextarea
                  value={values.description}
                  onChange={(event) => updateValues({ description: event.target.value })}
                  rows={3}
                  disabled={!canEdit}
                />
              </DsField>
            </div>
          </div>
        </DsCard>

        <DsCard title={bb("tags")}>
          <TagInput
            value={values.tags}
            onChange={(tags) => updateValues({ tags })}
            disabled={!canEdit}
            addTagLabel={bb("addTag")}
            addButtonLabel={bb("add")}
            removeItemLabel={(item) => bbRemoveItemLabel(bb, item)}
          />
        </DsCard>

        <DsCard title={bb("relatedProducts")}>
          {productOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{bb("noProductsAvailable")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {productOptions.map((product) => {
                const selected = values.relatedProductIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {product.name}
                  </button>
                );
              })}
            </div>
          )}
        </DsCard>

        <DsCard title={bb("relatedKnowledge")}>
          {articleOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{bb("noArticlesAvailable")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {articleOptions.map((article) => {
                const selected = values.relatedArticleIds.includes(article.id);
                return (
                  <button
                    key={article.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleArticle(article.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {article.title}
                  </button>
                );
              })}
            </div>
          )}
        </DsCard>

        <DsCard title={bb("autoSendRules")}>
          <label className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{bb("enableAutoSend")}</p>
              <p className="text-xs text-muted-foreground">
                {bb("allowAutoSendDescription")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.autoSendEnabled}
              disabled={!canEdit}
              onClick={() => updateValues({ autoSendEnabled: !values.autoSendEnabled })}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                values.autoSendEnabled ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  values.autoSendEnabled ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </label>

          <div className="space-y-2">
            {BRAIN_DOCUMENT_TRIGGERS.map((trigger) => (
              <label
                key={trigger}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm",
                  !values.autoSendEnabled && "opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={values.triggers.includes(trigger)}
                  disabled={!canEdit || !values.autoSendEnabled}
                  onChange={() => toggleTrigger(trigger)}
                  className="h-4 w-4 rounded border-border"
                />
                {bbDocumentTriggerLabel(bb, trigger)}
              </label>
            ))}
          </div>
        </DsCard>

        <DsCard title={bb("aiNotes")}>
          <DsTextarea
            value={values.aiNotes}
            onChange={(event) => updateValues({ aiNotes: event.target.value })}
            placeholder={bb("aiNotesPlaceholder")}
            rows={4}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title={bb("status")}>
          <div className="flex flex-wrap gap-2">
            {BRAIN_DOCUMENT_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={!canEdit}
                onClick={() => updateValues({ status })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50",
                  values.status === status
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {bbDocumentStatusLabel(bb, status)}
              </button>
            ))}
          </div>
        </DsCard>
      </div>
    </div>
  );
}

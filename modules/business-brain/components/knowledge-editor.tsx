"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ChevronDown, Save, Trash2, X } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import {
  DsField,
  DsSelect,
  DsTextInput,
} from "@/components/design-system/form-controls";
import {
  deleteBrainArticleAction,
  publishBrainArticleAction,
  updateBrainArticleAction,
} from "@/modules/business-brain/actions/knowledge-actions";
import { SimpleRichTextEditor } from "@/modules/business-brain/components/simple-rich-text-editor";
import { SegmentedControl } from "@/modules/business-brain/components/segmented-control";
import {
  BRAIN_ARTICLE_CATEGORIES,
  BRAIN_ARTICLE_CATEGORY_LABELS,
  BRAIN_ARTICLE_STATUS_LABELS,
  BRAIN_ARTICLE_VISIBILITY_LABELS,
  BRAIN_ARTICLE_VISIBILITIES,
  type BrainArticleDetail,
  type BrainArticleFormValues,
  type BrainArticleStatus,
} from "@/modules/business-brain/types/knowledge";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
};

type KnowledgeEditorProps = {
  article: BrainArticleDetail;
  productOptions: ProductOption[];
  canEdit: boolean;
  onBack?: () => void;
  onArticleUpdated: (article: BrainArticleDetail) => void;
  onArticleDeleted: (articleId: string) => void;
};

function valuesFromArticle(article: BrainArticleDetail): BrainArticleFormValues {
  return {
    title: article.title,
    category: article.category,
    content: article.content,
    keywords: article.keywords,
    visibility: article.visibility,
    status: article.status,
    relatedProductIds: article.relatedProductIds,
    aiMetadata: article.aiMetadata,
  };
}

function TagInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
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
          placeholder="Add keyword"
          disabled={disabled}
        />
        <DsButton type="button" variant="outline" onClick={addTag} disabled={disabled}>
          Add
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
                  aria-label={`Remove ${tag}`}
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

export function KnowledgeEditor({
  article,
  productOptions,
  canEdit,
  onBack,
  onArticleUpdated,
  onArticleDeleted,
}: KnowledgeEditorProps) {
  const [savedValues, setSavedValues] = useState(() => valuesFromArticle(article));
  const [values, setValues] = useState(savedValues);
  const [showAiMetadata, setShowAiMetadata] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );

  const updateValues = (patch: Partial<BrainArticleFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const syncArticle = (next: BrainArticleDetail) => {
    const nextValues = valuesFromArticle(next);
    setSavedValues(nextValues);
    setValues(nextValues);
    onArticleUpdated(next);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBrainArticleAction(article.id, values);
      if (!result.ok || !result.article) {
        setErrorMessage(result.ok ? "Article not found." : result.error);
        return;
      }
      syncArticle(result.article);
      setStatusMessage("Draft saved.");
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      const saveResult = await updateBrainArticleAction(article.id, values);
      if (!saveResult.ok) {
        setErrorMessage(saveResult.error);
        return;
      }
      const result = await publishBrainArticleAction(article.id);
      if (!result.ok || !result.article) {
        setErrorMessage(result.ok ? "Article not found." : result.error);
        return;
      }
      syncArticle(result.article);
      setStatusMessage("Article published.");
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this knowledge article?")) return;

    startTransition(async () => {
      const result = await deleteBrainArticleAction(article.id);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      onArticleDeleted(article.id);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack ? (
            <DsButton type="button" variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </DsButton>
          ) : null}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Knowledge Editor</h2>
            <p className="text-sm text-muted-foreground">
              Structured knowledge for AI retrieval.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <>
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
                Discard
              </DsButton>
              <DsButton type="button" onClick={handleSave} loading={isPending} disabled={!isDirty}>
                <Save className="h-4 w-4" />
                Save Draft
              </DsButton>
              <DsButton type="button" onClick={handlePublish} loading={isPending}>
                Publish
              </DsButton>
              <DsButton type="button" variant="outline" onClick={handleDelete} loading={isPending}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DsButton>
            </>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{statusMessage}</p>
      ) : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <div className="space-y-4">
        <DsCard title="Article">
          <div className="grid gap-4 md:grid-cols-2">
            <DsField label="Title">
              <DsTextInput
                value={values.title}
                onChange={(event) => updateValues({ title: event.target.value })}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label="Category">
              <DsSelect
                value={values.category}
                onChange={(event) =>
                  updateValues({
                    category: event.target.value as BrainArticleFormValues["category"],
                  })
                }
                disabled={!canEdit}
              >
                {BRAIN_ARTICLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {BRAIN_ARTICLE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </DsSelect>
            </DsField>
          </div>
        </DsCard>

        <DsCard title="Content">
          <SimpleRichTextEditor
            value={values.content}
            onChange={(content) => updateValues({ content })}
            disabled={!canEdit}
            placeholder="Write the knowledge article content..."
          />
        </DsCard>

        <DsCard title="Keywords">
          <TagInput
            value={values.keywords}
            onChange={(keywords) => updateValues({ keywords })}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title="Related Products">
          {productOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products yet. Create products in Business Brain to link them here.
            </p>
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

        <DsCard title="Visibility">
          <SegmentedControl
            aria-label="Visibility"
            value={values.visibility}
            onChange={(visibility) =>
              updateValues({
                visibility: visibility as BrainArticleFormValues["visibility"],
              })
            }
            options={BRAIN_ARTICLE_VISIBILITIES.map((value) => ({
              value,
              label: BRAIN_ARTICLE_VISIBILITY_LABELS[value],
            }))}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title="Status">
          <SegmentedControl
            aria-label="Status"
            value={values.status}
            onChange={(status) =>
              updateValues({ status: status as BrainArticleStatus })
            }
            options={Object.entries(BRAIN_ARTICLE_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard>
          <button
            type="button"
            onClick={() => setShowAiMetadata((current) => !current)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h3 className="text-base font-semibold text-foreground">AI Metadata</h3>
              <p className="text-sm text-muted-foreground">
                Hidden settings for future AI retrieval tuning.
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showAiMetadata ? "rotate-180" : "",
              )}
            />
          </button>

          {showAiMetadata ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DsField label="Confidence Weight (future)">
                <DsTextInput
                  type="number"
                  value={values.aiMetadata.confidenceWeight ?? ""}
                  onChange={(event) =>
                    updateValues({
                      aiMetadata: {
                        ...values.aiMetadata,
                        confidenceWeight: event.target.value
                          ? Number(event.target.value)
                          : null,
                      },
                    })
                  }
                  placeholder="0–100"
                  disabled={!canEdit}
                />
              </DsField>
              <DsField label="Priority (future)">
                <DsTextInput
                  type="number"
                  value={values.aiMetadata.priority ?? ""}
                  onChange={(event) =>
                    updateValues({
                      aiMetadata: {
                        ...values.aiMetadata,
                        priority: event.target.value
                          ? Number(event.target.value)
                          : null,
                      },
                    })
                  }
                  placeholder="0–10"
                  disabled={!canEdit}
                />
              </DsField>
              <div className="md:col-span-2">
                <DsField label="Related Documents">
                  <TagInput
                    value={values.aiMetadata.relatedDocuments ?? []}
                    onChange={(relatedDocuments) =>
                      updateValues({
                        aiMetadata: {
                          ...values.aiMetadata,
                          relatedDocuments,
                        },
                      })
                    }
                    disabled={!canEdit}
                  />
                </DsField>
              </div>
            </div>
          ) : null}
        </DsCard>
      </div>
    </div>
  );
}

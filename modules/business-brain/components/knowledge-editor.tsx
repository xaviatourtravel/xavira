"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ChevronDown, Save, Trash2, X } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
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
import {
  BusinessBrainCompactSection,
  BusinessBrainTwoColumnLayout,
} from "@/modules/business-brain/components/business-brain-content-shell";
import { ExpandableList } from "@/modules/business-brain/components/expandable-list";
import { SegmentedControl } from "@/modules/business-brain/components/segmented-control";
import { BB_COMPACT_INPUT_CLASS } from "@/modules/business-brain/lib/business-brain-compact-styles";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbArticleCategoryLabel,
  bbArticleStatusLabel,
  bbArticleVisibilityLabel,
  bbDisplayProductName,
} from "@/modules/business-brain/lib/bb-ui-labels";
import { formatTranslation } from "@/lib/i18n/dictionary";
import {
  BRAIN_ARTICLE_CATEGORIES,
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
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { bb } = useBbTranslation();
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
          placeholder={placeholder ?? bb("addKeyword")}
          disabled={disabled}
          className={BB_COMPACT_INPUT_CLASS}
        />
        <DsButton type="button" variant="outline" size="sm" onClick={addTag} disabled={disabled}>
          {bb("add")}
        </DsButton>
      </div>
      {value.length > 0 ? (
        <ExpandableList
          items={value}
          itemsClassName="flex flex-wrap gap-1.5"
          getItemKey={(tag) => tag}
          renderItem={(tag) => (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
              {tag}
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== tag))}
                  className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={formatTranslation(bb("removeItem"), { item: tag })}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </span>
          )}
        />
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
  const { bb } = useBbTranslation();
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
        setErrorMessage(result.ok ? bb("articleNotFound") : result.error);
        return;
      }
      syncArticle(result.article);
      setStatusMessage(bb("draftSaved"));
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
        setErrorMessage(result.ok ? bb("articleNotFound") : result.error);
        return;
      }
      syncArticle(result.article);
      setStatusMessage(bb("articlePublished"));
    });
  };

  const handleDelete = () => {
    if (!window.confirm(bb("deleteArticleConfirm"))) return;

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBack ? (
            <DsButton type="button" variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              {bb("back")}
            </DsButton>
          ) : null}
          <div>
            <h2 className="text-base font-semibold text-foreground">{bb("knowledgeEditor")}</h2>
            <p className="text-xs text-muted-foreground">
              {bb("knowledgeEditorDescription")}
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
                {bb("discard")}
              </DsButton>
              <DsButton type="button" onClick={handleSave} loading={isPending} disabled={!isDirty}>
                <Save className="h-4 w-4" />
                {bb("saveDraft")}
              </DsButton>
              <DsButton type="button" onClick={handlePublish} loading={isPending}>
                {bb("publish")}
              </DsButton>
              <DsButton type="button" variant="outline" onClick={handleDelete} loading={isPending}>
                <Trash2 className="h-4 w-4" />
                {bb("delete")}
              </DsButton>
            </>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{statusMessage}</p>
      ) : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <BusinessBrainTwoColumnLayout
        left={
          <>
            <BusinessBrainCompactSection title={bb("article")}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <DsField label={bb("title")}>
                  <DsTextInput
                    value={values.title}
                    onChange={(event) => updateValues({ title: event.target.value })}
                    disabled={!canEdit}
                    className={BB_COMPACT_INPUT_CLASS}
                  />
                </DsField>
                <DsField label={bb("category")}>
                  <DsSelect
                    value={values.category}
                    onChange={(event) =>
                      updateValues({
                        category: event.target.value as BrainArticleFormValues["category"],
                      })
                    }
                    disabled={!canEdit}
                    className={BB_COMPACT_INPUT_CLASS}
                  >
                    {BRAIN_ARTICLE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {bbArticleCategoryLabel(bb, category)}
                      </option>
                    ))}
                  </DsSelect>
                </DsField>
              </div>
            </BusinessBrainCompactSection>

            <BusinessBrainCompactSection title={bb("content")}>
              <SimpleRichTextEditor
                value={values.content}
                onChange={(content) => updateValues({ content })}
                disabled={!canEdit}
                placeholder={bb("writeArticleContent")}
                className="[&>div:last-child]:min-h-[120px] [&>div:last-child]:py-2"
              />
            </BusinessBrainCompactSection>

            <BusinessBrainCompactSection title={bb("keywords")}>
              <TagInput
                value={values.keywords}
                onChange={(keywords) => updateValues({ keywords })}
                disabled={!canEdit}
              />
            </BusinessBrainCompactSection>
          </>
        }
        right={
          <>
            <BusinessBrainCompactSection title={bb("relatedProducts")}>
              {productOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {bb("noProductsForLink")}
                </p>
              ) : (
                <ExpandableList
                  items={productOptions}
                  itemsClassName="flex flex-wrap gap-1.5"
                  getItemKey={(product) => product.id}
                  renderItem={(product) => {
                    const selected = values.relatedProductIds.includes(product.id);
                    return (
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleProduct(product.id)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                        )}
                      >
                        {bbDisplayProductName(bb, product.name)}
                      </button>
                    );
                  }}
                />
              )}
            </BusinessBrainCompactSection>

            <BusinessBrainCompactSection title={bb("visibility")}>
              <SegmentedControl
                aria-label={bb("visibility")}
                value={values.visibility}
                onChange={(visibility) =>
                  updateValues({
                    visibility: visibility as BrainArticleFormValues["visibility"],
                  })
                }
                options={BRAIN_ARTICLE_VISIBILITIES.map((value) => ({
                  value,
                  label: bbArticleVisibilityLabel(bb, value),
                }))}
                disabled={!canEdit}
              />
            </BusinessBrainCompactSection>

            <BusinessBrainCompactSection title={bb("status")}>
              <SegmentedControl
                aria-label={bb("status")}
                value={values.status}
                onChange={(status) =>
                  updateValues({ status: status as BrainArticleStatus })
                }
                options={(["draft", "published"] as const).map((status) => ({
                  value: status,
                  label: bbArticleStatusLabel(bb, status),
                }))}
                disabled={!canEdit}
              />
            </BusinessBrainCompactSection>

            <BusinessBrainCompactSection>
              <button
                type="button"
                onClick={() => setShowAiMetadata((current) => !current)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <h3 className="text-sm font-medium text-foreground">{bb("aiMetadata")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {bb("aiMetadataDescription")}
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
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <DsField label={bb("confidenceWeight")}>
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
                      placeholder={bb("confidenceWeightPlaceholder")}
                      disabled={!canEdit}
                      className={BB_COMPACT_INPUT_CLASS}
                    />
                  </DsField>
                  <DsField label={bb("priority")}>
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
                      placeholder={bb("priorityPlaceholder")}
                      disabled={!canEdit}
                      className={BB_COMPACT_INPUT_CLASS}
                    />
                  </DsField>
                  <div className="sm:col-span-2">
                    <DsField label={bb("relatedDocuments")}>
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
                        placeholder={bb("addTag")}
                      />
                    </DsField>
                  </div>
                </div>
              ) : null}
            </BusinessBrainCompactSection>
          </>
        }
      />
    </div>
  );
}

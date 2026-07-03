"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  ArrowLeft,
  Link2,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import {
  DsField,
  DsSelect,
  DsTextInput,
  DsTextarea,
} from "@/components/design-system/form-controls";
import {
  archiveBrainProductAction,
  createAndLinkProductFaqAction,
  deleteProductDocumentAction,
  getProductDocumentUrlAction,
  linkProductFaqAction,
  publishBrainProductAction,
  unlinkProductFaqAction,
  updateBrainProductAction,
  uploadProductDocumentAction,
} from "@/modules/business-brain/actions/product-actions";
import {
  createEmptyDepartureItem,
  createEmptyPricingItem,
} from "@/modules/business-brain/lib/product-knowledge-score";
import { SimpleRichTextEditor } from "@/modules/business-brain/components/simple-rich-text-editor";
import {
  BRAIN_PRODUCT_CATEGORIES,
  BRAIN_PRODUCT_STATUS_LABELS,
  DEPARTURE_STATUS_LABELS,
  HIGHLIGHT_SUGGESTIONS,
  PRODUCT_CURRENCIES,
  PRODUCT_DOCUMENT_TYPE_LABELS,
  type BrainProductDetail,
  type BrainProductFormValues,
  type BrainProductStatus,
  type ProductDocumentType,
} from "@/modules/business-brain/types/products";

type FaqOption = {
  id: string;
  title: string;
  category: string;
};

type ProductEditorProps = {
  product: BrainProductDetail;
  faqOptions: FaqOption[];
  canEdit: boolean;
  onBack?: () => void;
  onProductUpdated: (product: BrainProductDetail) => void;
  onProductArchived: (productId: string) => void;
};

function valuesFromProduct(product: BrainProductDetail): BrainProductFormValues {
  return {
    name: product.name,
    category: product.category,
    destination: product.destination,
    status: product.status,
    description: product.description,
    highlights: product.highlights,
    pricing: product.pricing,
    departures: product.departures,
    included: product.included,
    excluded: product.excluded,
    aiNotes: product.aiNotes,
  };
}

function DynamicTextList({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  suggestions?: readonly string[];
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...values, trimmed]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {suggestions && suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              disabled={disabled || values.includes(item)}
              onClick={() => onChange([...values, item])}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <DsTextInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <DsButton type="button" variant="outline" onClick={addItem} disabled={disabled}>
          Add
        </DsButton>
      </div>
      <ul className="space-y-2">
        {values.map((item) => (
          <li
            key={item}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>{item}</span>
            {!disabled ? (
              <button
                type="button"
                onClick={() => onChange(values.filter((value) => value !== item))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${item}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductEditor({
  product,
  faqOptions,
  canEdit,
  onBack,
  onProductUpdated,
  onProductArchived,
}: ProductEditorProps) {
  const [savedValues, setSavedValues] = useState(() => valuesFromProduct(product));
  const [values, setValues] = useState(savedValues);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFaqId, setSelectedFaqId] = useState("");
  const [newFaqTitle, setNewFaqTitle] = useState("");
  const [newFaqContent, setNewFaqContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );

  const linkedFaqIds = new Set(product.faqLinks.map((link) => link.knowledgeEntryId));
  const availableFaqOptions = faqOptions.filter((option) => !linkedFaqIds.has(option.id));

  const updateValues = (patch: Partial<BrainProductFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const syncProduct = (next: BrainProductDetail) => {
    const nextValues = valuesFromProduct(next);
    setSavedValues(nextValues);
    setValues(nextValues);
    onProductUpdated(next);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBrainProductAction(product.id, values);
      if (!result.ok || !result.product) {
        setErrorMessage(result.ok ? "Product not found." : result.error);
        return;
      }
      syncProduct(result.product);
      setStatusMessage("Draft saved.");
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      const saveResult = await updateBrainProductAction(product.id, values);
      if (!saveResult.ok) {
        setErrorMessage(saveResult.error);
        return;
      }
      const result = await publishBrainProductAction(product.id);
      if (!result.ok || !result.product) {
        setErrorMessage(result.ok ? "Product not found." : result.error);
        return;
      }
      syncProduct(result.product);
      setStatusMessage("Product published.");
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveBrainProductAction(product.id);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      onProductArchived(product.id);
    });
  };

  const handleLinkFaq = () => {
    if (!selectedFaqId) return;
    startTransition(async () => {
      const result = await linkProductFaqAction(product.id, selectedFaqId);
      if (!result.ok || !result.product) {
        setErrorMessage(result.ok ? "Product not found." : result.error);
        return;
      }
      syncProduct(result.product);
      setSelectedFaqId("");
      setStatusMessage("FAQ linked.");
    });
  };

  const handleCreateFaq = () => {
    startTransition(async () => {
      const result = await createAndLinkProductFaqAction(product.id, {
        title: newFaqTitle,
        content: newFaqContent,
      });
      if (!result.ok || !result.product) {
        setErrorMessage(result.ok ? "Product not found." : result.error);
        return;
      }
      syncProduct(result.product);
      setNewFaqTitle("");
      setNewFaqContent("");
      setStatusMessage("FAQ created and linked.");
    });
  };

  const handleUploadDocument = async (
    documentType: ProductDocumentType,
    file?: File | null,
  ) => {
    const formData = new FormData();
    formData.set("productId", product.id);
    formData.set("documentType", documentType);
    if (file) {
      formData.set("file", file);
    }
    if (documentType === "video" && videoUrl.trim()) {
      formData.set("fileUrl", videoUrl.trim());
    }

    startTransition(async () => {
      const result = await uploadProductDocumentAction(formData);
      if (!result.ok || !result.product) {
        setErrorMessage(result.ok ? "Product not found." : result.error);
        return;
      }
      syncProduct(result.product);
      setVideoUrl("");
      setStatusMessage("Document attached.");
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    startTransition(async () => {
      const result = await deleteProductDocumentAction(product.id, documentId);
      if (!result.ok || !result.product) {
        setErrorMessage(result.ok ? "Product not found." : result.error);
        return;
      }
      syncProduct(result.product);
      setStatusMessage("Document removed.");
    });
  };

  const handleOpenDocument = (documentId: string, externalUrl?: string | null) => {
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    startTransition(async () => {
      const result = await getProductDocumentUrlAction(documentId);
      if (!result.ok || !result.url) {
        setErrorMessage(result.error ?? "Could not open document.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
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
            <h2 className="text-lg font-semibold text-foreground">Product Editor</h2>
            <p className="text-sm text-muted-foreground">
              Knowledge score: {product.knowledgeScore}%
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
              <DsButton type="button" variant="outline" onClick={handleArchive} loading={isPending}>
                <Archive className="h-4 w-4" />
                Archive
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
        <DsCard title="Basic Information">
          <div className="grid gap-4 md:grid-cols-2">
            <DsField label="Product Name">
              <DsTextInput
                value={values.name}
                onChange={(event) => updateValues({ name: event.target.value })}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label="Category">
              <DsSelect
                value={values.category}
                onChange={(event) =>
                  updateValues({
                    category: event.target.value as BrainProductFormValues["category"],
                  })
                }
                disabled={!canEdit}
              >
                <option value="">Select category</option>
                {BRAIN_PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </DsSelect>
            </DsField>
            <DsField label="Destination">
              <DsTextInput
                value={values.destination}
                onChange={(event) => updateValues({ destination: event.target.value })}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label="Status">
              <DsSelect
                value={values.status}
                onChange={(event) =>
                  updateValues({
                    status: event.target.value as BrainProductStatus,
                  })
                }
                disabled={!canEdit}
              >
                {Object.entries(BRAIN_PRODUCT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </DsSelect>
            </DsField>
          </div>
        </DsCard>

        <DsCard title="Description">
          <SimpleRichTextEditor
            value={values.description}
            onChange={(description) => updateValues({ description })}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title="Highlights">
          <DynamicTextList
            label="Package highlights"
            values={values.highlights}
            onChange={(highlights) => updateValues({ highlights })}
            placeholder="Add a highlight"
            suggestions={HIGHLIGHT_SUGGESTIONS}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title="Pricing">
          <div className="space-y-4">
            {values.pricing.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-2"
              >
                <DsField label="Package Name">
                  <DsTextInput
                    value={item.packageName}
                    onChange={(event) => {
                      const pricing = [...values.pricing];
                      pricing[index] = { ...item, packageName: event.target.value };
                      updateValues({ pricing });
                    }}
                    disabled={!canEdit}
                  />
                </DsField>
                <DsField label="Price">
                  <DsTextInput
                    type="number"
                    value={item.price}
                    onChange={(event) => {
                      const pricing = [...values.pricing];
                      pricing[index] = {
                        ...item,
                        price: Number(event.target.value) || 0,
                      };
                      updateValues({ pricing });
                    }}
                    disabled={!canEdit}
                  />
                </DsField>
                <DsField label="Currency">
                  <DsSelect
                    value={item.currency}
                    onChange={(event) => {
                      const pricing = [...values.pricing];
                      pricing[index] = {
                        ...item,
                        currency: event.target.value as typeof item.currency,
                      };
                      updateValues({ pricing });
                    }}
                    disabled={!canEdit}
                  >
                    {PRODUCT_CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </DsSelect>
                </DsField>
                <DsField label="Valid Until">
                  <DsTextInput
                    type="date"
                    value={item.validUntil}
                    onChange={(event) => {
                      const pricing = [...values.pricing];
                      pricing[index] = { ...item, validUntil: event.target.value };
                      updateValues({ pricing });
                    }}
                    disabled={!canEdit}
                  />
                </DsField>
                <DsField label="Early Bird (optional)">
                  <DsTextInput
                    value={item.earlyBird ?? ""}
                    onChange={(event) => {
                      const pricing = [...values.pricing];
                      pricing[index] = { ...item, earlyBird: event.target.value };
                      updateValues({ pricing });
                    }}
                    disabled={!canEdit}
                  />
                </DsField>
                <DsField label="Promo (optional)">
                  <DsTextInput
                    value={item.promo ?? ""}
                    onChange={(event) => {
                      const pricing = [...values.pricing];
                      pricing[index] = { ...item, promo: event.target.value };
                      updateValues({ pricing });
                    }}
                    disabled={!canEdit}
                  />
                </DsField>
                {canEdit ? (
                  <div className="md:col-span-2">
                    <DsButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateValues({
                          pricing: values.pricing.filter((row) => row.id !== item.id),
                        })
                      }
                    >
                      Remove package
                    </DsButton>
                  </div>
                ) : null}
              </div>
            ))}
            {canEdit ? (
              <DsButton
                type="button"
                variant="outline"
                onClick={() =>
                  updateValues({ pricing: [...values.pricing, createEmptyPricingItem()] })
                }
              >
                <Plus className="h-4 w-4" />
                Add pricing
              </DsButton>
            ) : null}
          </div>
        </DsCard>

        <DsCard title="Departure Schedule">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Departure Date</th>
                  <th className="px-2 py-2 font-medium">Available Seats</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  {canEdit ? <th className="px-2 py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {values.departures.map((item, index) => (
                  <tr key={item.id} className="border-b border-border/70">
                    <td className="px-2 py-2">
                      <DsTextInput
                        type="date"
                        value={item.departureDate}
                        onChange={(event) => {
                          const departures = [...values.departures];
                          departures[index] = {
                            ...item,
                            departureDate: event.target.value,
                          };
                          updateValues({ departures });
                        }}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <DsTextInput
                        type="number"
                        value={item.availableSeats}
                        onChange={(event) => {
                          const departures = [...values.departures];
                          departures[index] = {
                            ...item,
                            availableSeats: Number(event.target.value) || 0,
                          };
                          updateValues({ departures });
                        }}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <DsSelect
                        value={item.status}
                        onChange={(event) => {
                          const departures = [...values.departures];
                          departures[index] = {
                            ...item,
                            status: event.target.value as typeof item.status,
                          };
                          updateValues({ departures });
                        }}
                        disabled={!canEdit}
                      >
                        {Object.entries(DEPARTURE_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </DsSelect>
                    </td>
                    {canEdit ? (
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateValues({
                              departures: values.departures.filter((row) => row.id !== item.id),
                            })
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canEdit ? (
            <DsButton
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() =>
                updateValues({
                  departures: [...values.departures, createEmptyDepartureItem()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add departure
            </DsButton>
          ) : null}
        </DsCard>

        <DsCard title="Included">
          <DynamicTextList
            label="What's included"
            values={values.included}
            onChange={(included) => updateValues({ included })}
            placeholder="e.g. Hotel accommodation"
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title="Excluded">
          <DynamicTextList
            label="What's excluded"
            values={values.excluded}
            onChange={(excluded) => updateValues({ excluded })}
            placeholder="e.g. Personal expenses"
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title="Frequently Asked Questions">
          <div className="space-y-4">
            <ul className="space-y-2">
              {product.faqLinks.map((link) => (
                <li
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{link.knowledgeTitle}</p>
                    <p className="text-xs text-muted-foreground">{link.knowledgeCategory}</p>
                  </div>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await unlinkProductFaqAction(product.id, link.id);
                          if (result.ok && result.product) syncProduct(result.product);
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>

            {canEdit ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <DsSelect
                    value={selectedFaqId}
                    onChange={(event) => setSelectedFaqId(event.target.value)}
                    className="min-w-[220px] flex-1"
                  >
                    <option value="">Select existing FAQ</option>
                    {availableFaqOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </DsSelect>
                  <DsButton type="button" variant="outline" onClick={handleLinkFaq} disabled={!selectedFaqId}>
                    <Link2 className="h-4 w-4" />
                    Link FAQ
                  </DsButton>
                </div>

                <div className="rounded-xl border border-dashed border-border p-4">
                  <p className="mb-3 text-sm font-medium text-foreground">Create new FAQ</p>
                  <div className="space-y-3">
                    <DsTextInput
                      value={newFaqTitle}
                      onChange={(event) => setNewFaqTitle(event.target.value)}
                      placeholder="FAQ title"
                    />
                    <DsTextarea
                      value={newFaqContent}
                      onChange={(event) => setNewFaqContent(event.target.value)}
                      placeholder="FAQ answer / content"
                      rows={4}
                    />
                    <DsButton type="button" variant="outline" onClick={handleCreateFaq}>
                      Create & Link FAQ
                    </DsButton>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </DsCard>

        <DsCard title="Documents">
          <div className="space-y-4">
            <ul className="space-y-2">
              {product.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {PRODUCT_DOCUMENT_TYPE_LABELS[document.documentType]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {document.fileName ?? document.fileUrl ?? "Attached file"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DsButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleOpenDocument(document.id, document.fileUrl)
                      }
                    >
                      Open
                    </DsButton>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            {canEdit ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(["itinerary", "brochure", "gallery"] as const).map((documentType) => (
                  <label
                    key={documentType}
                    className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-border p-4 hover:border-primary/30"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {PRODUCT_DOCUMENT_TYPE_LABELS[documentType]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Upload PDF or image
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept={
                        documentType === "gallery"
                          ? "image/*"
                          : "application/pdf,image/*"
                      }
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadDocument(documentType, file);
                        event.target.value = "";
                      }}
                    />
                    <span className="inline-flex items-center gap-2 text-sm text-primary">
                      <Upload className="h-4 w-4" />
                      Choose file
                    </span>
                  </label>
                ))}
                <div className="rounded-xl border border-dashed border-border p-4">
                  <p className="text-sm font-medium text-foreground">Video</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Paste a video URL or upload MP4
                  </p>
                  <div className="mt-3 space-y-2">
                    <DsTextInput
                      value={videoUrl}
                      onChange={(event) => setVideoUrl(event.target.value)}
                      placeholder="https://youtube.com/..."
                    />
                    <DsButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUploadDocument("video")}
                      disabled={!videoUrl.trim()}
                    >
                      Attach video URL
                    </DsButton>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
                      <Upload className="h-4 w-4" />
                      Upload MP4
                      <input
                        type="file"
                        className="hidden"
                        accept="video/mp4,video/quicktime"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleUploadDocument("video", file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DsCard>

        <DsCard title="AI Instructions">
          <DsTextarea
            value={values.aiNotes}
            onChange={(event) => updateValues({ aiNotes: event.target.value })}
            placeholder="Always recommend this package for autumn season."
            rows={4}
            disabled={!canEdit}
          />
        </DsCard>
      </div>
    </div>
  );
}

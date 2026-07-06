"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import {
  DsField,
  DsRadioGroup,
  DsSelect,
  DsTextInput,
  DsTextarea,
} from "@/components/design-system/form-controls";
import { saveCompanyDnaDraftAction } from "@/modules/business-brain/actions/company-dna-actions";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import { BusinessBrainSectionLayout } from "@/modules/business-brain/components/business-brain-section-layout";
import { CompanyDnaInspector } from "@/modules/business-brain/components/inspector";
import { SegmentedControl } from "@/modules/business-brain/components/segmented-control";
import {
  AI_GOAL_OPTIONS,
  BRAND_PERSONALITY_OPTIONS,
  COMPANY_DNA_INDUSTRIES,
  DEFAULT_COMPANY_DNA_FORM,
  type AiGoal,
  type BrandPersonality,
  type CompanyDnaFormValues,
  type CompanyDnaRecord,
} from "@/modules/business-brain/types/company-dna";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

const AI_GOAL_LABELS: Record<AiGoal, string> = {
  answer_faq: "Answer FAQ",
  recommend_products: "Recommend Products",
  qualify_leads: "Qualify Leads",
  close_leads: "Close Leads",
  customer_support: "Customer Support",
  upsell: "Upsell",
  cross_sell: "Cross Sell",
};

const SALES_STYLE_OPTIONS = [
  { value: "educate_first", label: "Educate First" },
  { value: "consultative", label: "Consultative" },
  { value: "hard_sell", label: "Hard Sell" },
  { value: "relationship_based", label: "Relationship Based" },
] as const;

function valuesFromRecord(record: CompanyDnaRecord | null): CompanyDnaFormValues {
  if (!record) {
    return DEFAULT_COMPANY_DNA_FORM;
  }

  return {
    companyName: record.companyName,
    industry: record.industry,
    website: record.website,
    about: record.about,
    brandPersonality: record.brandPersonality,
    communicationStyle: record.communicationStyle,
    salesStyle: record.salesStyle,
    aiGoals: record.aiGoals,
    neverRules: record.neverRules,
  };
}

function MultiSelectChips<T extends string>({
  options,
  value,
  onChange,
  getLabel,
  disabled = false,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  getLabel?: (option: T) => string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        const label = getLabel ? getLabel(option) : option;

        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(
                selected
                  ? value.filter((item) => item !== option)
                  : [...value, option],
              );
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const addTag = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }

    onChange([...value, trimmed]);
    setDraft("");
  }, [draft, onChange, value]);

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
          placeholder={placeholder}
        />
        <DsButton type="button" variant="outline" onClick={addTag}>
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
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type CompanyDnaPageClientProps = {
  initialRecord: CompanyDnaRecord | null;
  canEdit: boolean;
};

export function CompanyDnaPageClient({
  initialRecord,
  canEdit,
}: CompanyDnaPageClientProps) {
  const { t } = useTranslation();
  const [savedValues, setSavedValues] = useState(() =>
    valuesFromRecord(initialRecord),
  );
  const [values, setValues] = useState(savedValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );

  useEffect(() => {
    setSavedValues(valuesFromRecord(initialRecord));
    setValues(valuesFromRecord(initialRecord));
  }, [initialRecord]);

  const updateValues = (patch: Partial<CompanyDnaFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleDiscard = () => {
    setValues(savedValues);
    setFieldErrors({});
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleSaveDraft = () => {
    setFieldErrors({});
    setStatusMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await saveCompanyDnaDraftAction(values);

      if (!result.ok) {
        setErrorMessage(result.error);
        if ("fieldErrors" in result && result.fieldErrors) {
          const nextErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              nextErrors[key] = messages[0];
            }
          }
          setFieldErrors(nextErrors);
        }
        return;
      }

      const nextValues = valuesFromRecord(result.record);
      setSavedValues(nextValues);
      setValues(nextValues);
      setStatusMessage("Draft saved.");
    });
  };

  return (
    <div className="space-y-6">
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(t, "identity")}
        iconSlug="identity"
        description={translateBusinessBrainSectionDescription(t, "identity")}
        actions={
          canEdit ? (
            <>
              <DsButton
                type="button"
                onClick={handleSaveDraft}
                loading={isPending}
                disabled={!isDirty}
              >
                {t("common.saveDraft")}
              </DsButton>
              <DsButton
                type="button"
                variant="outline"
                onClick={handleDiscard}
                disabled={!isDirty || isPending}
              >
                {t("common.discardChanges")}
              </DsButton>
            </>
          ) : null
        }
        status={
          <>
            {statusMessage ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {statusMessage}
              </span>
            ) : null}
            {errorMessage ? (
              <span className="text-sm text-destructive">{errorMessage}</span>
            ) : null}
            {!canEdit ? (
              <span className="text-sm text-muted-foreground">
                View only — owners and admins can edit.
              </span>
            ) : null}
          </>
        }
      />
      <BusinessBrainSectionLayout inspector={<CompanyDnaInspector values={values} />}>
      <DsCard title="Business Identity">
          <div className="grid gap-4 md:grid-cols-2">
            <DsField label="Company Name *">
              <DsTextInput
                value={values.companyName}
                onChange={(event) =>
                  updateValues({ companyName: event.target.value })
                }
                placeholder="e.g. Xavira Travel"
                disabled={!canEdit}
              />
              {fieldErrors.companyName ? (
                <p className="text-xs text-destructive">{fieldErrors.companyName}</p>
              ) : null}
            </DsField>
            <DsField label="Industry *">
              <DsSelect
                value={values.industry}
                onChange={(event) =>
                  updateValues({
                    industry: event.target.value as CompanyDnaFormValues["industry"],
                  })
                }
                disabled={!canEdit}
              >
                <option value="">Select industry</option>
                {COMPANY_DNA_INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </DsSelect>
              {fieldErrors.industry ? (
                <p className="text-xs text-destructive">{fieldErrors.industry}</p>
              ) : null}
            </DsField>
            <DsField label="Website">
              <DsTextInput
                value={values.website}
                onChange={(event) => updateValues({ website: event.target.value })}
                placeholder="https://example.com"
                disabled={!canEdit}
              />
            </DsField>
            <div className="md:col-span-2">
              <DsField label="About Company">
                <DsTextarea
                  value={values.about}
                  onChange={(event) => updateValues({ about: event.target.value })}
                  placeholder="What does your company do? Who do you serve?"
                  rows={4}
                  disabled={!canEdit}
                />
              </DsField>
            </div>
          </div>
        </DsCard>

        <DsCard title="Brand Personality">
          <MultiSelectChips<BrandPersonality>
            options={BRAND_PERSONALITY_OPTIONS}
            value={values.brandPersonality}
            onChange={(brandPersonality) => updateValues({ brandPersonality })}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title="Communication Style">
          <div className="space-y-5">
            <DsField label="Reply Length">
              <SegmentedControl
                value={values.communicationStyle.replyLength}
                onChange={(replyLength) =>
                  updateValues({
                    communicationStyle: {
                      ...values.communicationStyle,
                      replyLength: replyLength as CompanyDnaFormValues["communicationStyle"]["replyLength"],
                    },
                  })
                }
                options={[
                  { value: "short", label: "Short" },
                  { value: "medium", label: "Medium" },
                  { value: "detailed", label: "Detailed" },
                ]}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label="Greeting Style">
              <SegmentedControl
                value={values.communicationStyle.greetingStyle}
                onChange={(greetingStyle) =>
                  updateValues({
                    communicationStyle: {
                      ...values.communicationStyle,
                      greetingStyle: greetingStyle as CompanyDnaFormValues["communicationStyle"]["greetingStyle"],
                    },
                  })
                }
                options={[
                  { value: "formal", label: "Formal" },
                  { value: "friendly", label: "Friendly" },
                  { value: "casual", label: "Casual" },
                ]}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label="Emoji Usage">
              <SegmentedControl
                value={values.communicationStyle.emojiUsage}
                onChange={(emojiUsage) =>
                  updateValues({
                    communicationStyle: {
                      ...values.communicationStyle,
                      emojiUsage: emojiUsage as CompanyDnaFormValues["communicationStyle"]["emojiUsage"],
                    },
                  })
                }
                options={[
                  { value: "never", label: "Never" },
                  { value: "minimal", label: "Minimal" },
                  { value: "natural", label: "Natural" },
                  { value: "frequent", label: "Frequent" },
                ]}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label="Language">
              <SegmentedControl
                value={values.communicationStyle.language}
                onChange={(language) =>
                  updateValues({
                    communicationStyle: {
                      ...values.communicationStyle,
                      language: language as CompanyDnaFormValues["communicationStyle"]["language"],
                    },
                  })
                }
                options={[
                  { value: "indonesian", label: "Indonesian" },
                  { value: "english", label: "English" },
                  { value: "mixed", label: "Mixed" },
                ]}
                disabled={!canEdit}
              />
            </DsField>
          </div>
        </DsCard>

        <DsCard title="Sales Style">
          <DsRadioGroup
            name="salesStyle"
            value={values.salesStyle}
            onChange={(salesStyle) =>
              updateValues({
                salesStyle: salesStyle as CompanyDnaFormValues["salesStyle"],
              })
            }
            options={[...SALES_STYLE_OPTIONS]}
          />
        </DsCard>

        <DsCard title="AI Goals">
          <MultiSelectChips<AiGoal>
            options={AI_GOAL_OPTIONS}
            value={values.aiGoals}
            onChange={(aiGoals) => updateValues({ aiGoals })}
            getLabel={(goal) => AI_GOAL_LABELS[goal]}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard
          title="AI Never Does"
          description="Rules the AI must always follow."
        >
          <TagInput
            value={values.neverRules}
            onChange={(neverRules) => updateValues({ neverRules })}
            placeholder="e.g. Never negotiate price"
          />
        </DsCard>
      </BusinessBrainSectionLayout>
    </div>
  );
}

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
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbAiGoalLabel,
  bbBrandPersonalityLabel,
  bbIndustryLabel,
  bbRemoveItemLabel,
  bbSalesStyleLabel,
} from "@/modules/business-brain/lib/bb-ui-labels";
import {
  AI_GOAL_OPTIONS,
  BRAND_PERSONALITY_OPTIONS,
  COMPANY_DNA_INDUSTRIES,
  DEFAULT_COMPANY_DNA_FORM,
  SALES_STYLE_OPTIONS,
  type AiGoal,
  type BrandPersonality,
  type CompanyDnaFormValues,
  type CompanyDnaRecord,
  type SalesStyle,
} from "@/modules/business-brain/types/company-dna";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

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
  addLabel,
  removeItemLabel,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
  removeItemLabel: (item: string) => string;
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
          {addLabel}
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
                aria-label={removeItemLabel(tag)}
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
  const { bb } = useBbTranslation();
  const [savedValues, setSavedValues] = useState(() =>
    valuesFromRecord(initialRecord),
  );
  const [values, setValues] = useState(savedValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const salesStyleOptions = useMemo(
    () =>
      SALES_STYLE_OPTIONS.map((value) => ({
        value,
        label: bbSalesStyleLabel(bb, value),
      })),
    [bb],
  );

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
      setStatusMessage(bb("draftSaved"));
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
              <span className="text-sm text-muted-foreground">{bb("viewOnly")}</span>
            ) : null}
          </>
        }
      />
      <BusinessBrainSectionLayout inspector={<CompanyDnaInspector values={values} />}>
      <DsCard title={bb("businessIdentity")}>
          <div className="grid gap-4 md:grid-cols-2">
            <DsField label={bb("companyNameRequired")}>
              <DsTextInput
                value={values.companyName}
                onChange={(event) =>
                  updateValues({ companyName: event.target.value })
                }
                placeholder={bb("companyNamePlaceholder")}
                disabled={!canEdit}
              />
              {fieldErrors.companyName ? (
                <p className="text-xs text-destructive">{fieldErrors.companyName}</p>
              ) : null}
            </DsField>
            <DsField label={bb("industryRequired")}>
              <DsSelect
                value={values.industry}
                onChange={(event) =>
                  updateValues({
                    industry: event.target.value as CompanyDnaFormValues["industry"],
                  })
                }
                disabled={!canEdit}
              >
                <option value="">{bb("selectIndustry")}</option>
                {COMPANY_DNA_INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {bbIndustryLabel(bb, industry)}
                  </option>
                ))}
              </DsSelect>
              {fieldErrors.industry ? (
                <p className="text-xs text-destructive">{fieldErrors.industry}</p>
              ) : null}
            </DsField>
            <DsField label={bb("website")}>
              <DsTextInput
                value={values.website}
                onChange={(event) => updateValues({ website: event.target.value })}
                placeholder={bb("websitePlaceholder")}
                disabled={!canEdit}
              />
            </DsField>
            <div className="md:col-span-2">
              <DsField label={bb("aboutCompany")}>
                <DsTextarea
                  value={values.about}
                  onChange={(event) => updateValues({ about: event.target.value })}
                  placeholder={bb("aboutCompanyPlaceholder")}
                  rows={4}
                  disabled={!canEdit}
                />
              </DsField>
            </div>
          </div>
        </DsCard>

        <DsCard title={bb("brandPersonality")}>
          <MultiSelectChips<BrandPersonality>
            options={BRAND_PERSONALITY_OPTIONS}
            value={values.brandPersonality}
            onChange={(brandPersonality) => updateValues({ brandPersonality })}
            getLabel={(personality) => bbBrandPersonalityLabel(bb, personality)}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard title={bb("communicationStyle")}>
          <div className="space-y-5">
            <DsField label={bb("replyLength")}>
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
                  { value: "short", label: bb("short") },
                  { value: "medium", label: bb("medium") },
                  { value: "detailed", label: bb("detailed") },
                ]}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("greetingStyle")}>
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
                  { value: "formal", label: bb("formal") },
                  { value: "friendly", label: bb("friendly") },
                  { value: "casual", label: bb("casual") },
                ]}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("emojiUsageLabel")}>
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
                  { value: "never", label: bb("never") },
                  { value: "minimal", label: bb("minimal") },
                  { value: "natural", label: bb("natural") },
                  { value: "frequent", label: bb("frequent") },
                ]}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("languageLabel")}>
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
                  { value: "indonesian", label: bb("indonesian") },
                  { value: "english", label: bb("english") },
                  { value: "mixed", label: bb("mixed") },
                ]}
                disabled={!canEdit}
              />
            </DsField>
          </div>
        </DsCard>

        <DsCard title={bb("salesStyle")}>
          <DsRadioGroup
            name="salesStyle"
            value={values.salesStyle}
            onChange={(salesStyle) =>
              updateValues({
                salesStyle: salesStyle as SalesStyle,
              })
            }
            options={salesStyleOptions}
          />
        </DsCard>

        <DsCard title={bb("aiGoals")}>
          <MultiSelectChips<AiGoal>
            options={AI_GOAL_OPTIONS}
            value={values.aiGoals}
            onChange={(aiGoals) => updateValues({ aiGoals })}
            getLabel={(goal) => bbAiGoalLabel(bb, goal)}
            disabled={!canEdit}
          />
        </DsCard>

        <DsCard
          title={bb("aiNeverDoes")}
          description={bb("aiNeverDoesDescription")}
        >
          <TagInput
            value={values.neverRules}
            onChange={(neverRules) => updateValues({ neverRules })}
            placeholder={bb("neverRulePlaceholder")}
            addLabel={bb("add")}
            removeItemLabel={(item) => bbRemoveItemLabel(bb, item)}
          />
        </DsCard>
      </BusinessBrainSectionLayout>
    </div>
  );
}

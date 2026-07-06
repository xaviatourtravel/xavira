"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

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
  ALWAYS_DO_EXAMPLE_KEYS,
  bbHandoverExampleLabel,
  bbHandoverTriggerLabel,
  bbQualificationFieldLabel,
  NEVER_DO_EXAMPLE_KEYS,
} from "@/modules/business-brain/lib/bb-ui-labels";
import {
  createBrainBehaviorAction,
  deleteBrainBehaviorAction,
  disableBrainBehaviorAction,
  enableBrainBehaviorAction,
  updateBrainBehaviorAction,
  updateQualificationRulesAction,
  updateReplyStyleAction,
} from "@/modules/business-brain/actions/behavior-actions";
import {
  BEHAVIOR_EMOJI_USAGE_OPTIONS,
  BEHAVIOR_REPLY_LENGTH_OPTIONS,
  CTA_STYLE_OPTIONS,
  DEFAULT_HANDOFF_MESSAGE,
  HANDOVER_ASSIGN_ROLES,
  HANDOVER_EXAMPLES,
  HANDOVER_TRIGGER_INTENTS,
  LANGUAGE_STYLE_OPTIONS,
  type BrainBehaviorRecord,
  type HandoverRuleConfig,
  type QualificationConfig,
  type ReplyStyleConfig,
} from "@/modules/business-brain/types/behaviors";
import { cn } from "@/lib/utils";

type BehaviorEditorProps = {
  behavior: BrainBehaviorRecord | null;
  category: BrainBehaviorRecord["type"];
  canEdit: boolean;
  isNew: boolean;
  onBack?: () => void;
  onBehaviorUpdated: (behavior: BrainBehaviorRecord) => void;
  onBehaviorDeleted: (behaviorId: string) => void;
  onCancelCreate: () => void;
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

function SegmentedOptions({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50",
            value === option.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function BehaviorEditor({
  behavior,
  category,
  canEdit,
  isNew,
  onBack,
  onBehaviorUpdated,
  onBehaviorDeleted,
  onCancelCreate,
}: BehaviorEditorProps) {
  const { bb } = useBbTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [handoverConfig, setHandoverConfig] = useState<HandoverRuleConfig>({
    triggerIntent: "negotiation",
    assignToRole: "Sales",
    handoffMessage: DEFAULT_HANDOFF_MESSAGE,
  });
  const [replyStyle, setReplyStyle] = useState<ReplyStyleConfig>({
    useKak: true,
    avoidRepeatedGreeting: true,
    maxReplyLength: "medium",
    emojiUsage: "minimal",
    ctaStyle: "consultative",
    languageStyle: "mixed",
  });
  const [qualification, setQualification] = useState<QualificationConfig>({
    destination: true,
    departureMonth: true,
    passengerCount: true,
    budget: true,
    privateOrGroup: false,
    specialNeeds: false,
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isNew) {
      setName("");
      setDescription("");
      setEnabled(true);
      setHandoverConfig({
        triggerIntent: "negotiation",
        assignToRole: "Sales",
        handoffMessage: DEFAULT_HANDOFF_MESSAGE,
      });
      setStatusMessage(null);
      setErrorMessage(null);
      return;
    }

    if (!behavior) return;
    setName(behavior.name);
    setDescription(behavior.description);
    setEnabled(behavior.enabled);
    if (behavior.type === "HANDOVER_RULE") {
      setHandoverConfig(behavior.config as HandoverRuleConfig);
    }
    if (behavior.type === "REPLY_STYLE") {
      setReplyStyle(behavior.config as ReplyStyleConfig);
    }
    if (behavior.type === "QUALIFICATION_RULE") {
      setQualification(behavior.config as QualificationConfig);
    }
    setStatusMessage(null);
    setErrorMessage(null);
  }, [behavior, isNew]);

  const editorTitle = useMemo(() => {
    if (isNew) return bb("newRule");
    if (category === "REPLY_STYLE") return bb("replyStyle");
    if (category === "QUALIFICATION_RULE") return bb("qualificationRules");
    return behavior?.name ?? bb("behaviorEditor");
  }, [bb, behavior?.name, category, isNew]);

  const exampleChips = useMemo(() => {
    if (category === "ALWAYS_DO") {
      return ALWAYS_DO_EXAMPLE_KEYS.map((key) => bb(key));
    }
    if (category === "NEVER_DO") {
      return NEVER_DO_EXAMPLE_KEYS.map((key) => bb(key));
    }
    return [];
  }, [bb, category]);

  const applyHandoverExample = (example: (typeof HANDOVER_EXAMPLES)[number]) => {
    setName(
      bbHandoverExampleLabel(bb, example.triggerIntent, example.assignToRole),
    );
    setHandoverConfig({
      triggerIntent: example.triggerIntent,
      assignToRole: example.assignToRole,
      handoffMessage: DEFAULT_HANDOFF_MESSAGE,
    });
  };

  const handleSave = () => {
    if (!behavior && !isNew) return;

    startTransition(async () => {
      if (isNew) {
        if (category === "REPLY_STYLE" || category === "QUALIFICATION_RULE") return;

        const trimmedName = name.trim();
        if (!trimmedName && category !== "HANDOVER_RULE") {
          setErrorMessage(bb("ruleNameRequired"));
          return;
        }

        const payload =
          category === "HANDOVER_RULE"
            ? {
                type: category,
                name:
                  trimmedName ||
                  bbHandoverTriggerLabel(bb, handoverConfig.triggerIntent),
                description,
                config: handoverConfig,
              }
            : {
                type: category,
                name: trimmedName,
                description,
              };

        const result = await createBrainBehaviorAction(payload);
        if (!result.ok || !result.behavior) {
          setErrorMessage(result.ok ? bb("createFailed") : result.error);
          return;
        }

        onBehaviorUpdated(result.behavior);
        setStatusMessage(bb("ruleCreated"));
        return;
      }

      if (category === "REPLY_STYLE" && behavior) {
        const result = await updateReplyStyleAction(behavior.id, {
          config: replyStyle,
          enabled,
        });
        if (!result.ok || !result.behavior) {
          setErrorMessage(result.ok ? bb("saveFailed") : result.error);
          return;
        }
        onBehaviorUpdated(result.behavior);
        setStatusMessage(bb("replyStyleSaved"));
        return;
      }

      if (category === "QUALIFICATION_RULE" && behavior) {
        const result = await updateQualificationRulesAction(behavior.id, {
          config: qualification,
          enabled,
        });
        if (!result.ok || !result.behavior) {
          setErrorMessage(result.ok ? bb("saveFailed") : result.error);
          return;
        }
        onBehaviorUpdated(result.behavior);
        setStatusMessage(bb("qualificationRulesSaved"));
        return;
      }

      if (!behavior) return;

      const result = await updateBrainBehaviorAction(behavior.id, {
        type: category,
        name,
        description,
        enabled,
        config: category === "HANDOVER_RULE" ? handoverConfig : {},
      });

      if (!result.ok || !result.behavior) {
        setErrorMessage(result.ok ? bb("saveFailed") : result.error);
        return;
      }

      onBehaviorUpdated(result.behavior);
      setStatusMessage(bb("ruleSaved"));
    });
  };

  const handleToggleEnabled = () => {
    if (!behavior) return;
    startTransition(async () => {
      const result = behavior.enabled
        ? await disableBrainBehaviorAction(behavior.id)
        : await enableBrainBehaviorAction(behavior.id);
      if (!result.ok || !result.behavior) {
        setErrorMessage(result.ok ? bb("updateFailed") : result.error);
        return;
      }
      onBehaviorUpdated(result.behavior);
      setEnabled(result.behavior.enabled);
    });
  };

  const handleDelete = () => {
    if (!behavior || !window.confirm(bb("deleteRuleConfirm"))) return;
    startTransition(async () => {
      const result = await deleteBrainBehaviorAction(behavior.id);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      onBehaviorDeleted(behavior.id);
    });
  };

  if (!behavior && !isNew) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">{bb("rulesSelectPrompt")}</p>
      </div>
    );
  }

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
            <h2 className="text-lg font-semibold text-foreground">{editorTitle}</h2>
            <p className="text-sm text-muted-foreground">{bb("teachAiHowTeamWorks")}</p>
          </div>
        </div>
        {canEdit && (behavior || isNew) ? (
          <div className="flex flex-wrap items-center gap-2">
            {!isNew && behavior && category !== "REPLY_STYLE" && category !== "QUALIFICATION_RULE" ? (
              <>
                <DsButton type="button" variant="outline" onClick={handleToggleEnabled} loading={isPending}>
                  {enabled ? bb("disable") : bb("enable")}
                </DsButton>
                <DsButton type="button" variant="outline" onClick={handleDelete} loading={isPending}>
                  <Trash2 className="h-4 w-4" />
                  {bb("delete")}
                </DsButton>
              </>
            ) : null}
            {isNew ? (
              <DsButton type="button" variant="outline" onClick={onCancelCreate}>
                {bb("cancel")}
              </DsButton>
            ) : null}
            <DsButton type="button" onClick={handleSave} loading={isPending}>
              <Save className="h-4 w-4" />
              {isNew ? bb("createRule") : bb("save")}
            </DsButton>
          </div>
        ) : null}
      </div>

      {statusMessage ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{statusMessage}</p>
      ) : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      {(category === "ALWAYS_DO" || category === "NEVER_DO") && (behavior || isNew) ? (
        <DsCard title={bb("rule")}>
          <div className="space-y-4">
            <DsField label={bb("ruleName")}>
              <DsTextInput value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
            </DsField>
            <DsField label={bb("description")}>
              <DsTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={!canEdit}
              />
            </DsField>
            {isNew && exampleChips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {exampleChips.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setName(example)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>
            ) : null}
            {!isNew ? (
              <ToggleRow
                label={bb("enabled")}
                checked={enabled}
                onChange={setEnabled}
                disabled={!canEdit}
              />
            ) : null}
          </div>
        </DsCard>
      ) : null}

      {category === "HANDOVER_RULE" && (behavior || isNew) ? (
        <DsCard title={bb("handoverRule")}>
          <div className="space-y-4">
            <DsField label={bb("ruleName")}>
              <DsTextInput value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
            </DsField>
            <DsField label={bb("triggerIntent")}>
              <DsSelect
                value={handoverConfig.triggerIntent}
                onChange={(e) =>
                  setHandoverConfig((current) => ({
                    ...current,
                    triggerIntent: e.target.value as HandoverRuleConfig["triggerIntent"],
                  }))
                }
                disabled={!canEdit}
              >
                {HANDOVER_TRIGGER_INTENTS.map((intent) => (
                  <option key={intent} value={intent}>
                    {bbHandoverTriggerLabel(bb, intent)}
                  </option>
                ))}
              </DsSelect>
            </DsField>
            <DsField label={bb("assignToRole")}>
              <DsSelect
                value={handoverConfig.assignToRole}
                onChange={(e) =>
                  setHandoverConfig((current) => ({
                    ...current,
                    assignToRole: e.target.value as HandoverRuleConfig["assignToRole"],
                  }))
                }
                disabled={!canEdit}
              >
                {HANDOVER_ASSIGN_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </DsSelect>
            </DsField>
            <DsField label={bb("aiHandoffMessage")}>
              <DsTextarea
                value={handoverConfig.handoffMessage}
                onChange={(e) =>
                  setHandoverConfig((current) => ({
                    ...current,
                    handoffMessage: e.target.value,
                  }))
                }
                rows={3}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("descriptionOptional")}>
              <DsTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={!canEdit}
              />
            </DsField>
            {isNew ? (
              <div className="flex flex-wrap gap-2">
                {HANDOVER_EXAMPLES.map((example) => (
                  <button
                    key={example.triggerIntent}
                    type="button"
                    onClick={() => applyHandoverExample(example)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    {bbHandoverExampleLabel(bb, example.triggerIntent, example.assignToRole)}
                  </button>
                ))}
              </div>
            ) : null}
            {!isNew ? (
              <ToggleRow
                label={bb("enabled")}
                checked={enabled}
                onChange={setEnabled}
                disabled={!canEdit}
              />
            ) : null}
          </div>
        </DsCard>
      ) : null}

      {category === "REPLY_STYLE" && behavior ? (
        <DsCard title={bb("replyStyle")}>
          <div className="space-y-4">
            <ToggleRow
              label={bb("useKak")}
              description={bb("useKakDescription")}
              checked={replyStyle.useKak}
              onChange={(useKak) => setReplyStyle((current) => ({ ...current, useKak }))}
              disabled={!canEdit}
            />
            <ToggleRow
              label={bb("avoidRepeatedGreeting")}
              description={bb("avoidRepeatedGreetingDescription")}
              checked={replyStyle.avoidRepeatedGreeting}
              onChange={(avoidRepeatedGreeting) =>
                setReplyStyle((current) => ({ ...current, avoidRepeatedGreeting }))
              }
              disabled={!canEdit}
            />
            <DsField label={bb("maxReplyLength")}>
              <SegmentedOptions
                value={replyStyle.maxReplyLength}
                onChange={(maxReplyLength) =>
                  setReplyStyle((current) => ({
                    ...current,
                    maxReplyLength: maxReplyLength as ReplyStyleConfig["maxReplyLength"],
                  }))
                }
                options={BEHAVIOR_REPLY_LENGTH_OPTIONS.map((value) => ({
                  value,
                  label: bb(value),
                }))}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("emojiUsage")}>
              <SegmentedOptions
                value={replyStyle.emojiUsage}
                onChange={(emojiUsage) =>
                  setReplyStyle((current) => ({
                    ...current,
                    emojiUsage: emojiUsage as ReplyStyleConfig["emojiUsage"],
                  }))
                }
                options={BEHAVIOR_EMOJI_USAGE_OPTIONS.map((value) => ({
                  value,
                  label: bb(value),
                }))}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("ctaStyle")}>
              <SegmentedOptions
                value={replyStyle.ctaStyle}
                onChange={(ctaStyle) =>
                  setReplyStyle((current) => ({
                    ...current,
                    ctaStyle: ctaStyle as ReplyStyleConfig["ctaStyle"],
                  }))
                }
                options={CTA_STYLE_OPTIONS.map((value) => ({
                  value,
                  label: bb(value),
                }))}
                disabled={!canEdit}
              />
            </DsField>
            <DsField label={bb("languageStyle")}>
              <SegmentedOptions
                value={replyStyle.languageStyle}
                onChange={(languageStyle) =>
                  setReplyStyle((current) => ({
                    ...current,
                    languageStyle: languageStyle as ReplyStyleConfig["languageStyle"],
                  }))
                }
                options={LANGUAGE_STYLE_OPTIONS.map((value) => ({
                  value,
                  label: bb(value),
                }))}
                disabled={!canEdit}
              />
            </DsField>
            <ToggleRow
              label={bb("configEnabled")}
              checked={enabled}
              onChange={setEnabled}
              disabled={!canEdit}
            />
          </div>
        </DsCard>
      ) : null}

      {category === "QUALIFICATION_RULE" && behavior ? (
        <DsCard title={bb("requiredQuestions")}>
          <div className="space-y-3">
            {(Object.keys(qualification) as Array<keyof QualificationConfig>).map(
              (field) => (
                <ToggleRow
                  key={field}
                  label={bbQualificationFieldLabel(bb, field)}
                  checked={qualification[field]}
                  onChange={(value) =>
                    setQualification((current) => ({ ...current, [field]: value }))
                  }
                  disabled={!canEdit}
                />
              ),
            )}
            <ToggleRow
              label={bb("qualificationRulesEnabled")}
              checked={enabled}
              onChange={setEnabled}
              disabled={!canEdit}
            />
          </div>
        </DsCard>
      ) : null}

    </div>
  );
}

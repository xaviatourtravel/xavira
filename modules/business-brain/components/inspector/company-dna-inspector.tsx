"use client";

import { Check, Sparkles } from "lucide-react";

import type { BbUiKey } from "@/lib/i18n/bb-ui-dictionary";
import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorConversationBubble,
  InspectorEmptyState,
  InspectorKeyValueRow,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import { generateIdentityPreview } from "@/modules/business-brain/lib/generate-identity-preview";
import {
  deriveIdentityActiveRules,
  deriveIdentityCompleteness,
} from "@/modules/business-brain/lib/identity-inspector-thinking";
import type {
  AiGoal,
  CommunicationLanguage,
  CompanyDnaFormValues,
  EmojiUsage,
  GreetingStyle,
  ReplyLength,
  SalesStyle,
} from "@/modules/business-brain/types/company-dna";

type CompanyDnaInspectorProps = {
  values: CompanyDnaFormValues;
};

const GREETING_BB_KEYS: Record<GreetingStyle, BbUiKey> = {
  formal: "formal",
  friendly: "friendly",
  casual: "casual",
};

const REPLY_LENGTH_BB_KEYS: Record<ReplyLength, BbUiKey> = {
  short: "short",
  medium: "medium",
  detailed: "detailed",
};

const EMOJI_BB_KEYS: Record<EmojiUsage, BbUiKey> = {
  never: "never",
  minimal: "minimal",
  natural: "natural",
  frequent: "frequent",
};

const LANGUAGE_BB_KEYS: Record<CommunicationLanguage, BbUiKey> = {
  indonesian: "indonesian",
  english: "english",
  mixed: "mixed",
};

const SALES_STYLE_BB_KEYS: Record<SalesStyle, BbUiKey> = {
  educate_first: "educateFirst",
  consultative: "consultative",
  hard_sell: "hardSell",
  relationship_based: "relationshipBased",
};

const AI_GOAL_BB_KEYS: Record<AiGoal, BbUiKey> = {
  answer_faq: "goalAnswerFaq",
  recommend_products: "goalRecommendProducts",
  qualify_leads: "goalQualifyLeads",
  close_leads: "goalCloseLeads",
  customer_support: "goalCustomerSupport",
  upsell: "goalUpsell",
  cross_sell: "goalCrossSell",
};

const COMPLETENESS_FIELD_BB_KEYS: Record<string, BbUiKey> = {
  "Company Name": "companyName",
  Industry: "industry",
  "About Company": "aboutCompany",
};

const DERIVED_RULE_BB_KEYS: Record<string, BbUiKey> = {
  "Answer FAQ clearly from knowledge": "goalDerivedAnswerFaq",
  "Recommend relevant products when appropriate": "goalDerivedRecommendProducts",
  "Ask one question at a time": "goalDerivedQualifyLeads",
  "Guide customers toward booking": "goalDerivedCloseLeads",
  "Provide helpful customer support": "goalDerivedCustomerSupport",
  "Suggest upgrades when appropriate": "goalDerivedUpsell",
  "Suggest complementary services": "goalDerivedCrossSell",
  "Keep reply concise": "ruleKeepReplyConcise",
  "Do not use emojis": "ruleDoNotUseEmojis",
  "Do not promise availability without confirmation": "ruleDoNotPromiseAvailabilityConfirm",
  "Do not promise availability": "ruleDoNotPromiseAvailability",
};

function translateDerivedRule(rule: string, bb: (key: BbUiKey) => string): string {
  return DERIVED_RULE_BB_KEYS[rule] ? bb(DERIVED_RULE_BB_KEYS[rule]) : rule;
}

export function CompanyDnaInspector({ values }: CompanyDnaInspectorProps) {
  const { bb } = useBbTranslation();
  const preview = generateIdentityPreview(values);
  const activeRules = deriveIdentityActiveRules(values);
  const completeness = deriveIdentityCompleteness(values);
  const { communicationStyle } = values;

  const tone =
    values.brandPersonality.length > 0
      ? values.brandPersonality.join(", ")
      : bb("notSet");

  return (
    <BusinessBrainInspector
      title={bb("liveAiPreview")}
      subtitle={bb("liveAiPreviewSubtitle")}
      icon={Sparkles}
    >
      <InspectorSection title={bb("conversation")}>
        <div className="space-y-3">
          <InspectorConversationBubble role="customer">
            {preview.customerMessage}
          </InspectorConversationBubble>
          <div className="flex justify-center py-0.5 text-muted-foreground" aria-hidden>
            ↓
          </div>
          <InspectorConversationBubble role="ai">{preview.aiReply}</InspectorConversationBubble>
        </div>
      </InspectorSection>

      <InspectorSection title={bb("aiThinking")}>
        <div className="space-y-2 rounded-lg bg-muted/35 px-3.5 py-3">
          <InspectorKeyValueRow label={bb("tone")} value={tone} />
          <InspectorKeyValueRow
            label={bb("greeting")}
            value={bb(GREETING_BB_KEYS[communicationStyle.greetingStyle])}
          />
          <InspectorKeyValueRow
            label={bb("replyLengthLabel")}
            value={bb(REPLY_LENGTH_BB_KEYS[communicationStyle.replyLength])}
          />
          <InspectorKeyValueRow
            label={bb("emoji")}
            value={bb(EMOJI_BB_KEYS[communicationStyle.emojiUsage])}
          />
          <InspectorKeyValueRow
            label={bb("language")}
            value={bb(LANGUAGE_BB_KEYS[communicationStyle.language])}
          />
          <InspectorKeyValueRow
            label={bb("salesStyleLabel")}
            value={bb(SALES_STYLE_BB_KEYS[values.salesStyle])}
          />
        </div>
      </InspectorSection>

      <InspectorSection title={bb("activeRules")}>
        {activeRules.length > 0 ? (
          <ul className="space-y-1.5 rounded-lg bg-muted/35 px-3.5 py-3">
            {activeRules.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>{translateDerivedRule(rule, bb)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <InspectorEmptyState message={bb("identityEmptyRules")} />
        )}
      </InspectorSection>

      <InspectorSection title={bb("aiGoalsSection")}>
        {values.aiGoals.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {values.aiGoals.map((goal) => (
              <InspectorBadge key={goal} variant="default">
                {bb(AI_GOAL_BB_KEYS[goal])}
              </InspectorBadge>
            ))}
          </div>
        ) : (
          <InspectorEmptyState message={bb("noAiGoalsSelected")} />
        )}
      </InspectorSection>

      <div className="rounded-lg border border-border bg-background px-3.5 py-3">
        {completeness.complete ? (
          <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
            {bb("identityReady")}
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {bb("completeIdentity")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {bb("missing")}{" "}
              {completeness.missing
                .map((field) => bb(COMPLETENESS_FIELD_BB_KEYS[field] ?? "companyName"))
                .join(", ")}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{bb("updatesInstantly")}</p>
    </BusinessBrainInspector>
  );
}

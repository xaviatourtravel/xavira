import { marketingContentEn } from "@/lib/marketing/i18n/en";
import { marketingContentId } from "@/lib/marketing/i18n/id";

export type MarketingLocaleCode = "id" | "en";
export type MarketingContent =
  | typeof marketingContentId
  | typeof marketingContentEn;

const CONTENT_BY_LOCALE: Record<MarketingLocaleCode, MarketingContent> = {
  id: marketingContentId,
  en: marketingContentEn,
};

export function getMarketingContent(locale: MarketingLocaleCode): MarketingContent {
  return CONTENT_BY_LOCALE[locale];
}

export { marketingContentId, marketingContentEn };

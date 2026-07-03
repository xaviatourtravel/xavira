import type {
  BehaviorContext,
  DocumentContext,
  KnowledgeContext,
  ProductContext,
} from "@/modules/business-brain/types/context";
import type { BrainArticleCategory } from "@/modules/business-brain/types/knowledge";
import type {
  RetrieveRelevantContextParams,
  RetrievedBusinessBrainContext,
} from "@/modules/ai/types/context-retrieval";
import { RETRIEVAL_LIMITS } from "@/modules/ai/types/context-retrieval";

type Scored<T> = {
  item: T;
  score: number;
  matchedKeywords: string[];
};

const BROCHURE_DOCUMENT_KEYWORDS = [
  "brochure",
  "brosur",
  "details",
  "detail",
  "itinerary",
  "profile",
  "company profile",
];

const INTENT_ARTICLE_CATEGORIES: Partial<Record<string, BrainArticleCategory[]>> = {
  PRICE_INQUIRY: ["payment", "faq"],
  VISA: ["visa", "faq"],
  HALAL_FOOD: ["halal", "faq"],
  PAYMENT: ["payment", "terms", "refund", "faq"],
  ITINERARY_REQUEST: ["faq", "custom"],
  PACKAGE_INQUIRY: ["faq", "custom"],
  PACKAGE_RECOMMENDATION: ["faq", "custom"],
  DEPARTURE_DATE: ["faq", "custom"],
  BOOKING: ["payment", "terms", "faq"],
  FLIGHT: ["faq", "custom"],
  HOTEL: ["faq", "custom"],
};

function tokenize(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length > 2),
    ),
  ];
}

function includesAny(haystack: string, needles: string[]) {
  const normalized = haystack.toLowerCase();
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function scoreHaystack(
  haystack: string,
  tokens: string[],
  boostKeywords: string[] = [],
): { score: number; matchedKeywords: string[] } {
  const normalized = haystack.toLowerCase();
  const matched = new Set<string>();
  let score = 0;

  for (const token of tokens) {
    if (normalized.includes(token)) {
      score += 2;
      matched.add(token);
    }
  }

  for (const keyword of boostKeywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      score += 3;
      matched.add(keyword);
    }
  }

  return {
    score,
    matchedKeywords: [...matched],
  };
}

function rankByScore<T>(
  items: T[],
  scoreItem: (item: T) => { score: number; matchedKeywords: string[] },
  limit: number,
): Scored<T>[] {
  return items
    .map((item) => {
      const scored = scoreItem(item);
      return {
        item,
        score: scored.score,
        matchedKeywords: scored.matchedKeywords,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function scoreProduct(product: ProductContext, tokens: string[]): Scored<ProductContext> {
  const haystack = [
    product.name,
    product.category,
    product.destination,
    product.description,
    product.highlights.join(" "),
    product.included.join(" "),
    product.aiNotes,
  ].join(" ");

  const scored = scoreHaystack(haystack, tokens);
  return { item: product, ...scored };
}

function scoreArticle(article: KnowledgeContext, tokens: string[]): Scored<KnowledgeContext> {
  const haystack = [
    article.title,
    article.category,
    article.content,
    article.keywords.join(" "),
  ].join(" ");

  const scored = scoreHaystack(haystack, tokens);
  return { item: article, ...scored };
}

function scoreDocument(
  document: DocumentContext,
  tokens: string[],
  boostKeywords: string[] = [],
): Scored<DocumentContext> {
  const haystack = [
    document.name,
    document.description,
    document.documentType,
    document.tags.join(" "),
    document.aiNotes,
  ].join(" ");

  const scored = scoreHaystack(haystack, tokens, boostKeywords);
  return { item: document, ...scored };
}

function filterArticlesByIntent(
  articles: KnowledgeContext[],
  intent: string,
): KnowledgeContext[] {
  const categories = INTENT_ARTICLE_CATEGORIES[intent];
  if (!categories || categories.length === 0) {
    return articles;
  }

  const filtered = articles.filter((article) => categories.includes(article.category));
  return filtered.length > 0 ? filtered : articles;
}

function retrieveProducts(
  products: ProductContext[],
  intent: string,
  tokens: string[],
): Scored<ProductContext>[] {
  const scored = products
    .map((product) => scoreProduct(product, tokens))
    .sort((left, right) => right.score - left.score);

  const matched = scored.filter((entry) => entry.score > 0);

  if (matched.length > 0) {
    return matched.slice(0, RETRIEVAL_LIMITS.products);
  }

  if (
    intent === "PACKAGE_INQUIRY" ||
    intent === "PACKAGE_RECOMMENDATION" ||
    intent === "PRICE_INQUIRY" ||
    intent === "ITINERARY_REQUEST" ||
    intent === "DEPARTURE_DATE"
  ) {
    return scored.slice(0, Math.min(RETRIEVAL_LIMITS.products, products.length));
  }

  return [];
}

function retrieveArticles(
  articles: KnowledgeContext[],
  intent: string,
  tokens: string[],
  products: ProductContext[],
): Scored<KnowledgeContext>[] {
  const pool = filterArticlesByIntent(articles, intent);

  if (intent === "PRICE_INQUIRY" || intent === "PAYMENT") {
    const paymentArticles = pool.filter((article) =>
      ["payment", "terms", "refund", "faq"].includes(article.category),
    );
    const ranked = rankByScore(paymentArticles, (item) => scoreArticle(item, tokens), RETRIEVAL_LIMITS.articles);
    if (ranked.length > 0) {
      return ranked;
    }
  }

  if (intent === "VISA") {
    const visaArticles = pool.filter((article) => article.category === "visa");
    const ranked = rankByScore(visaArticles, (item) => scoreArticle(item, tokens), RETRIEVAL_LIMITS.articles);
    if (ranked.length > 0) {
      return ranked;
    }
  }

  if (intent === "HALAL_FOOD") {
    const halalArticles = pool.filter((article) => article.category === "halal");
    const ranked = rankByScore(
      halalArticles,
      (item) => scoreArticle(item, [...tokens, "halal", "makanan"]),
      RETRIEVAL_LIMITS.articles,
    );
    if (ranked.length > 0) {
      return ranked;
    }
  }

  const productTokens = products.flatMap((product) =>
    tokenize(`${product.destination} ${product.name} ${product.category}`),
  );

  return rankByScore(
    pool,
    (item) => scoreArticle(item, [...tokens, ...productTokens]),
    RETRIEVAL_LIMITS.articles,
  );
}

function retrieveDocuments(
  documents: DocumentContext[],
  intent: string,
  tokens: string[],
  products: ProductContext[],
): Scored<DocumentContext>[] {
  if (intent === "BROCHURE_REQUEST" || intent === "ITINERARY_REQUEST") {
    const brochureMatches = rankByScore(
      documents,
      (item) =>
        scoreDocument(
          item,
          tokens,
          intent === "BROCHURE_REQUEST" ? BROCHURE_DOCUMENT_KEYWORDS : ["itinerary", "jadwal"],
        ),
      RETRIEVAL_LIMITS.documents,
    );

    if (brochureMatches.length > 0) {
      return brochureMatches;
    }
  }

  const productTokens = products.flatMap((product) =>
    tokenize(`${product.destination} ${product.name}`),
  );

  return rankByScore(
    documents,
    (item) => scoreDocument(item, [...tokens, ...productTokens]),
    RETRIEVAL_LIMITS.documents,
  );
}

function retrieveAlwaysDoBehaviors(
  behaviors: BehaviorContext[],
  intent: string,
  tokens: string[],
): BehaviorContext[] {
  const alwaysDo = behaviors.filter((item) => item.type === "ALWAYS_DO" && item.enabled);

  return rankByScore(
    alwaysDo,
    (item) => scoreHaystack(`${item.name} ${item.description}`, tokens, [intent.toLowerCase()]),
    RETRIEVAL_LIMITS.behaviors,
  ).map((entry) => entry.item);
}

function collectMatchedKeywords(entries: Array<{ matchedKeywords: string[] }>) {
  return [...new Set(entries.flatMap((entry) => entry.matchedKeywords))];
}

/**
 * Retrieve a focused Business Brain context slice for prompt building.
 */
export function retrieveRelevantContext(
  params: RetrieveRelevantContextParams,
): RetrievedBusinessBrainContext {
  const { customerMessage, intent, businessBrainContext } = params;
  const normalizedIntent = intent.trim().toUpperCase() || "UNKNOWN";
  const tokens = tokenize(customerMessage);

  const neverDoBehaviors = businessBrainContext.behaviors.filter(
    (item) => item.type === "NEVER_DO" && item.enabled,
  );
  const handoverRules = businessBrainContext.handoverRules.filter((item) => item.enabled);

  const productEntries = retrieveProducts(
    businessBrainContext.products,
    normalizedIntent,
    tokens,
  );
  const relevantProducts = productEntries.map((entry) => entry.item);

  const articleEntries = retrieveArticles(
    businessBrainContext.knowledge,
    normalizedIntent,
    tokens,
    relevantProducts,
  );
  const relevantArticles = articleEntries.map((entry) => entry.item);

  const documentEntries = retrieveDocuments(
    businessBrainContext.documents,
    normalizedIntent,
    tokens,
    relevantProducts,
  );
  const relevantDocuments = documentEntries.map((entry) => entry.item);

  const alwaysDoBehaviors = retrieveAlwaysDoBehaviors(
    businessBrainContext.behaviors,
    normalizedIntent,
    tokens,
  );

  const remainingBehaviorSlots = Math.max(
    0,
    RETRIEVAL_LIMITS.behaviors - neverDoBehaviors.length,
  );
  const relevantBehaviors = [
    ...neverDoBehaviors,
    ...alwaysDoBehaviors.slice(0, remainingBehaviorSlots),
  ].slice(0, RETRIEVAL_LIMITS.behaviors);

  const matchedKeywords = collectMatchedKeywords([
    ...productEntries,
    ...articleEntries,
    ...documentEntries,
  ]);

  const retrievalSummary = {
    productCount: relevantProducts.length,
    articleCount: relevantArticles.length,
    documentCount: relevantDocuments.length,
    behaviorCount: relevantBehaviors.length,
    matchedKeywords,
    intent: normalizedIntent,
  };

  return {
    companyDNA: businessBrainContext.companyDNA,
    relevantProducts,
    relevantArticles,
    relevantDocuments,
    relevantBehaviors,
    handoverRules,
    replyStyle: businessBrainContext.replyStyle,
    qualificationRules: businessBrainContext.qualificationRules,
    retrievalSummary,
  };
}

import type { CatalogResult, ResponsePlan } from "@/modules/ai/response-planner/types";
import {
  canonicalizeCountryQuery,
  getCountryDisplayName,
  productMatchesCountry,
  productMatchesDestination,
} from "@/modules/ai/response-planner/product-geography";
import {
  isProductEligibleForCountryQuery,
  isProductEligibleForDestinationQuery,
} from "@/modules/ai/response-planner/geographic-eligibility";
import {
  extractMentionedMonthsFromReply,
  mentionedMonthOutsideRequestedPeriod,
} from "@/modules/ai/response-planner/resolve-schedule-period";
import type { ProductContext } from "@/modules/business-brain/types/context";

const NO_RESULT_PATTERNS = [
  /\bbelum\s+menemukan\s+paket\b/i,
  /\btidak\s+ada\s+paket\b/i,
  /\bno\s+active\b/i,
  /\bno\s+matching\b/i,
];

const AVAILABILITY_CLAIM_PATTERNS = [
  /\bada\s+kak\b/i,
  /\btersedia\b/i,
  /\bmasih\s+ada\b/i,
];

export type CatalogConsistencyResult = {
  passed: boolean;
  contradictionDetected: boolean;
  geographicViolationDetected: boolean;
  violations: string[];
  fallbackReply: string | null;
};

export type GeographyAssessment = {
  passed: boolean;
  excludedEntityIds: string[];
  exclusionReasons: Record<string, string>;
  violations: string[];
};

function listedProductNames(reply: string, results: CatalogResult[]): string[] {
  return results
    .map((item) => item.displayName)
    .filter((name) => reply.toLowerCase().includes(name.toLowerCase().slice(0, 12)));
}

function detectUnplannedProductsInReply(
  reply: string,
  plan: ResponsePlan,
  products: ProductContext[],
): { geographicViolation: boolean; violations: string[] } {
  const violations: string[] = [];
  const catalogIds = new Set(plan.catalogResults.map((item) => item.entityId));
  const replyLower = reply.toLowerCase();

  for (const product of products) {
    if (catalogIds.has(product.id)) continue;
    const marker = product.name.toLowerCase().slice(0, 12);
    if (!marker || !replyLower.includes(marker)) continue;

    violations.push("unplanned_product_in_reply");
    if (plan.catalogQueryType === "country" && plan.catalogQueryValue) {
      const canonical = canonicalizeCountryQuery(plan.catalogQueryValue);
      if (canonical && !isProductEligibleForCountryQuery(product, canonical)) {
        violations.push("wrong_country_in_reply");
      }
    }
    if (plan.catalogQueryType === "destination" && plan.catalogQueryValue) {
      if (!isProductEligibleForDestinationQuery(product, plan.catalogQueryValue)) {
        violations.push("wrong_destination_in_reply");
      }
    }
  }

  return {
    geographicViolation: violations.some((item) =>
      ["wrong_country_in_reply", "wrong_destination_in_reply"].includes(item),
    ),
    violations,
  };
}

export function detectWrongMonthInReply(reply: string, plan: ResponsePlan): boolean {
  const geo = plan.geographicDiagnostics;
  if (!geo?.requestedPeriodStart || !geo.requestedPeriodEnd) return false;
  if (plan.requestType !== "SCHEDULE_OR_DEPARTURE" && plan.requestType !== "AVAILABILITY") {
    return false;
  }

  const period = {
    month: geo.requestedPeriodMonth,
    year: geo.requestedPeriodYear,
    startDate: geo.requestedPeriodStart,
    endDate: geo.requestedPeriodEnd,
  };

  return extractMentionedMonthsFromReply(reply).some((mentioned) =>
    mentionedMonthOutsideRequestedPeriod(mentioned, period),
  );
}

export function assessCatalogGeography(input: {
  catalogQueryType: ResponsePlan["catalogQueryType"];
  catalogQueryValue: string | null;
  catalogResults: CatalogResult[];
  products: ProductContext[];
}): GeographyAssessment {
  const violations: string[] = [];
  const excludedEntityIds: string[] = [];
  const exclusionReasons: Record<string, string> = {};

  if (input.catalogQueryType === "country" && input.catalogQueryValue) {
    const canonical = canonicalizeCountryQuery(input.catalogQueryValue);
    if (canonical) {
      for (const result of input.catalogResults) {
        const product = input.products.find((item) => item.id === result.entityId);
        if (product && !isProductEligibleForCountryQuery(product, canonical)) {
          violations.push("wrong_country_in_catalog");
          excludedEntityIds.push(result.entityId);
          exclusionReasons[result.entityId] = "wrong_country";
        }
      }
    }
  }

  if (input.catalogQueryType === "destination" && input.catalogQueryValue) {
    for (const result of input.catalogResults) {
      if (result.matchType === "same_country_alternative") continue;
      const product = input.products.find((item) => item.id === result.entityId);
      if (product) {
        if (!isProductEligibleForDestinationQuery(product, input.catalogQueryValue)) {
          violations.push("wrong_destination_in_catalog");
          excludedEntityIds.push(result.entityId);
          exclusionReasons[result.entityId] = "wrong_destination";
          continue;
        }
        const matchType = productMatchesDestination(product, input.catalogQueryValue);
        if (matchType === "no_match") {
          violations.push("wrong_destination_in_catalog");
          excludedEntityIds.push(result.entityId);
          exclusionReasons[result.entityId] = "wrong_destination";
        }
      }
    }
  }

  return {
    passed: violations.length === 0,
    excludedEntityIds,
    exclusionReasons,
    violations,
  };
}

export function validateCatalogConsistency(input: {
  reply: string;
  plan: ResponsePlan;
  products?: ProductContext[];
}): CatalogConsistencyResult {
  const violations: string[] = [];
  const reply = input.reply.trim();
  const results = input.plan.catalogResults;
  const listed = listedProductNames(reply, results);

  if (results.length > 0 && NO_RESULT_PATTERNS.some((pattern) => pattern.test(reply))) {
    violations.push("no_result_with_catalog");
  }

  if (results.length === 0 && listed.length > 0) {
    violations.push("results_without_catalog_plan");
  }

  let geographicViolationDetected = false;
  if (input.products?.length) {
    const assessment = assessCatalogGeography({
      catalogQueryType: input.plan.catalogQueryType,
      catalogQueryValue: input.plan.catalogQueryValue,
      catalogResults: results,
      products: input.products,
    });
    if (!assessment.passed) {
      geographicViolationDetected = true;
      violations.push(...assessment.violations);
    }

    const unplanned = detectUnplannedProductsInReply(reply, input.plan, input.products);
    if (unplanned.violations.length > 0) {
      violations.push(...unplanned.violations);
      if (unplanned.geographicViolation) {
        geographicViolationDetected = true;
      }
    }
  } else if (input.plan.geographicDiagnostics?.excludedEntityIds.length) {
    geographicViolationDetected = true;
    violations.push("wrong_country_in_catalog");
  }

  if (
    input.plan.catalogQueryType === "destination" &&
    results.some((item) => item.matchType === "same_country_alternative") &&
    /\bberikut\s+pilihan\b/i.test(reply) &&
    !/\blainnya\b/i.test(reply) &&
    !/\bbelum\s+menemukan\s+paket\s+aktif\s+khusus\b/i.test(reply)
  ) {
    violations.push("alternatives_presented_as_exact");
  }

  if (results.length > 0 && listed.length === 0 && input.plan.directAnswerRequired) {
    violations.push("catalog_not_reflected_in_reply");
  }

  const contradictionDetected = violations.length > 0;
  const fallbackReply = contradictionDetected ? buildCatalogConsistencyFallback(input.plan) : null;

  return {
    passed: !contradictionDetected,
    contradictionDetected,
    geographicViolationDetected,
    violations,
    fallbackReply,
  };
}

export function detectScheduleContradiction(reply: string, plan: ResponsePlan): boolean {
  if (detectWrongMonthInReply(reply, plan)) {
    return true;
  }

  if (plan.verifiedFacts.some((fact) => fact.field === "departure_date")) {
    return false;
  }
  if (plan.requestType !== "SCHEDULE_OR_DEPARTURE" && plan.requestType !== "AVAILABILITY") {
    return false;
  }
  return AVAILABILITY_CLAIM_PATTERNS.some((pattern) => pattern.test(reply));
}

export function buildCatalogConsistencyFallback(plan: ResponsePlan): string | null {
  if (plan.directAnswerTemplate) return plan.directAnswerTemplate;
  if (plan.catalogResults.length === 0) {
    const label = plan.catalogQueryValue
      ? getCountryDisplayName(canonicalizeCountryQuery(plan.catalogQueryValue) ?? plan.catalogQueryValue)
      : "permintaan tersebut";
    return `Maaf Kak, saat ini saya belum menemukan paket aktif untuk ${label} pada data kami. Saya teruskan ke tim sales agar bisa dibantu lebih lanjut.`;
  }
  return null;
}

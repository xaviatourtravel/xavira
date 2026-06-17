import type {
  PerformanceRow,
  RevenueFunnel,
  RevenueIntelligenceMetrics,
} from "@/lib/dashboard/revenue-intelligence";

export type RevenueInsight = {
  title: string;
  detail: string;
};

const MAX_ROWS_PER_GROUP = 8;

function serializeRows(rows: PerformanceRow[]) {
  return rows.slice(0, MAX_ROWS_PER_GROUP).map((row) => ({
    label: row.label,
    leads: row.leads,
    bookings: row.bookings,
    conversionRatePercent: row.conversionRate,
  }));
}

function serializeFunnel(funnel: RevenueFunnel) {
  return {
    totalLeads: funnel.totalLeads,
    qualified: funnel.qualified,
    warmOrHot: funnel.warmOrHot,
    booking: funnel.booking,
    paid: funnel.paid,
  };
}

export function buildRevenueInsightsPayload(metrics: RevenueIntelligenceMetrics) {
  return {
    leadSourcePerformance: serializeRows(metrics.leadSourcePerformance),
    campaignPerformance: serializeRows(metrics.campaignPerformance),
    packagePerformance: serializeRows(metrics.packagePerformance),
    salesPerformance: serializeRows(metrics.salesPerformance),
    funnel: serializeFunnel(metrics.funnel),
  };
}

export function buildRevenueInsightsPrompt(
  metrics: RevenueIntelligenceMetrics,
): string {
  const payload = buildRevenueInsightsPayload(metrics);

  return [
    "You are a travel agency business analyst. Analyze the performance metrics below and produce concise, actionable insights for the business owner.",
    "",
    "STRICT RULES:",
    "- Use ONLY the numbers provided in the data. Never invent figures, revenue, or rupiah amounts.",
    "- Conversion rate = bookings / leads (already provided as a percentage).",
    "- If a group has very few leads, treat its conversion rate as low-confidence and say so.",
    "- Write in Bahasa Indonesia, professional but easy to read.",
    "- Focus on where the owner should invest time and budget.",
    "",
    "Cover insights such as: highest converting lead source, lowest converting lead source, best performing package, best performing sales rep, and any notable funnel drop-off.",
    "",
    "DATA (JSON):",
    JSON.stringify(payload, null, 2),
    "",
    "Respond with ONLY valid JSON in this exact shape (no markdown, no code fences):",
    '{ "insights": [ { "title": "short headline", "detail": "1-2 sentence explanation with the relevant numbers" } ] }',
    "Provide between 3 and 5 insights.",
  ].join("\n");
}

function coerceInsight(value: unknown): RevenueInsight | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const detail = typeof record.detail === "string" ? record.detail.trim() : "";

  if (!title && !detail) {
    return null;
  }

  return {
    title: title || "Insight",
    detail,
  };
}

export function parseRevenueInsightsResponse(raw: string): RevenueInsight[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== "object") {
    return [];
  }

  const insightsValue = (parsed as Record<string, unknown>).insights;
  if (!Array.isArray(insightsValue)) {
    return [];
  }

  return insightsValue
    .map(coerceInsight)
    .filter((insight): insight is RevenueInsight => insight !== null)
    .slice(0, 5);
}

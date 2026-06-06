import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";
import { AiUsageCard } from "@/components/dashboard/ai-usage-card";
import { AiSalesCopilotCard } from "@/components/dashboard/ai-sales-copilot-card";
import { FollowUpTodayCard, type FollowUpTodayTask } from "@/components/dashboard/follow-up-today-card";
import { PipelineSummaryCard } from "@/components/dashboard/pipeline-summary-card";
import {
  PaketTerlarisCard,
  SumberLeadCard,
} from "@/components/dashboard/business-analytics-card";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const today = new Date();
  const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);

const [
  { count: totalLeads },
  { count: pendingFollowUps },
  { count: overdueFollowUps },
  { data: todayFollowUps },
  { data: pipelineLeads },
  { data: packageLeads },
  { data: sourceLeads },
  { data: aiLogs },
  { data: priorityLeads },
  { count: totalBookings, data: orgBookings },
  { data: orgBookingPayments },
] = await Promise.all([
  
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),

    supabase
      .from("follow_up_tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending"),

    supabase
      .from("follow_up_tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .lt("due_date", today.toISOString()),
      supabase
  .from("follow_up_tasks")
  .select(`
    id,
    title,
    due_date,
    lead_id,
    leads (
  full_name,
  package_interest,
  whatsapp_number,
  phone
)
  `)
  .eq("organization_id", profile.organization_id)
  .eq("status", "pending")
  .gte("due_date", todayStart.toISOString())
  .lte("due_date", todayEnd.toISOString())
  .order("due_date", { ascending: true }),
  supabase
  .from("leads")
  .select("status")
  .eq("organization_id", profile.organization_id)
  .is("deleted_at", null),
  supabase
  .from("leads")
  .select("package_interest")
  .eq("organization_id", profile.organization_id)
  .is("deleted_at", null),  
  supabase
  .from("leads")
  .select("source")
  .eq("organization_id", profile.organization_id)
  .is("deleted_at", null),
  supabase
  .from("ai_generation_logs")
  .select("input_tokens, output_tokens, estimated_cost_usd")
  .eq("organization_id", profile.organization_id),
  supabase
  .from("leads")
  .select(`
    id,
    full_name,
    status,
    package_interest,
    updated_at
  `)
  .eq("organization_id", profile.organization_id)
  .is("deleted_at", null),
  supabase
    .from("bookings")
    .select("total_pax, total_amount", { count: "exact" })
    .eq("organization_id", profile.organization_id),
  supabase
    .from("booking_payments")
    .select("amount, bookings!inner(organization_id)")
    .eq("bookings.organization_id", profile.organization_id),
]);

  const funnel = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal_sent: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
  };
  const packageStats: Record<string, number> = {};

for (const lead of packageLeads ?? []) {
  if (!lead.package_interest) continue;

  packageStats[lead.package_interest] =
    (packageStats[lead.package_interest] ?? 0) + 1;
}

const topPackages = Object.entries(packageStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

  const sourceStats: Record<string, number> = {};

for (const lead of sourceLeads ?? []) {
  if (!lead.source) continue;

  sourceStats[lead.source] =
    (sourceStats[lead.source] ?? 0) + 1;
}

const topSources = Object.entries(sourceStats)
  .sort((a, b) => b[1] - a[1]);

  for (const lead of pipelineLeads ?? []) {
    const status = lead.status as keyof typeof funnel;

    if (status in funnel) {
      funnel[status]++;
    }
  }

  const leadToWonRate =
    totalLeads && totalLeads > 0
      ? Math.round((funnel.won / totalLeads) * 100)
      : 0;

  const proposalTotal =
    funnel.proposal_sent + funnel.negotiating + funnel.won + funnel.lost;

  const proposalToWonRate =
    proposalTotal > 0
      ? Math.round((funnel.won / proposalTotal) * 100)
      : 0;
  const aiUsage = {
    totalGenerations: aiLogs?.length ?? 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
  };
  
  for (const log of aiLogs ?? []) {
    aiUsage.inputTokens += log.input_tokens ?? 0;
    aiUsage.outputTokens += log.output_tokens ?? 0;
    aiUsage.estimatedCostUsd += Number(log.estimated_cost_usd ?? 0);
  }
  
  const totalAiTokens = aiUsage.inputTokens + aiUsage.outputTokens;

  const leadScores = (priorityLeads ?? []).map((lead) => {
    let score = 0;
  
    if (lead.status === "negotiating") score += 50;
    if (lead.status === "proposal_sent") score += 40;
    if (lead.status === "qualified") score += 30;
    if (lead.status === "contacted") score += 20;
  
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(lead.updated_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  
    score += Math.min(daysSinceUpdate * 2, 20);
  
    return {
      ...lead,
      score,
      daysSinceUpdate,
    };
  });
  
  const topPriorityLeads = leadScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const totalPax = (orgBookings ?? []).reduce(
    (sum, booking) => sum + (booking.total_pax ?? 0),
    0,
  );
  const totalBookingAmount = (orgBookings ?? []).reduce(
    (sum, booking) => sum + Number(booking.total_amount ?? 0),
    0,
  );
  const paymentReceived = (orgBookingPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );
  const outstandingBalance = totalBookingAmount - paymentReceived;
    
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Ringkasan aktivitas CRM Xavira.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Total Leads
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalLeads ?? 0}
          </h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Lead → Won
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {leadToWonRate}%
          </h2>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Proposal → Won
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {proposalToWonRate}%
          </h2>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Follow Up Pending
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {pendingFollowUps ?? 0}
          </h2>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Follow Up Terlambat
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {overdueFollowUps ?? 0}
          </h2>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Follow Up Hari Ini
          </p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {todayFollowUps?.length ?? 0}
          </h2>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Booking Overview</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Ringkasan booking dan pembayaran organisasi.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <h2 className="mt-2 text-2xl font-bold">{totalBookings ?? 0}</h2>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Total Pax</p>
            <h2 className="mt-2 text-2xl font-bold">{totalPax}</h2>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Payment Received</p>
            <h2 className="mt-2 text-2xl font-bold">
              {formatCurrency(paymentReceived)}
            </h2>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <h2 className="mt-2 text-2xl font-bold">
              {formatCurrency(outstandingBalance)}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <FollowUpTodayCard
            todayFollowUps={todayFollowUps as FollowUpTodayTask[] | null}
          />
          <PipelineSummaryCard funnel={funnel} />
          <PaketTerlarisCard topPackages={topPackages} />
        </div>

        <div className="space-y-6">
          <AiSalesCopilotCard leads={topPriorityLeads} />
          <AiUsageCard
            totalGenerations={aiUsage.totalGenerations}
            inputTokens={aiUsage.inputTokens}
            outputTokens={aiUsage.outputTokens}
            estimatedCostUsd={aiUsage.estimatedCostUsd}
            totalAiTokens={totalAiTokens}
          />
          <SumberLeadCard topSources={topSources} />
        </div>
      </div>
    </div>
  );
}

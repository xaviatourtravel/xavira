import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";
import { AiUsageCard } from "@/components/dashboard/ai-usage-card";
import { AiSalesCopilotCard } from "@/components/dashboard/ai-sales-copilot-card";

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
  
  for (const lead of pipelineLeads ?? []) {
    const status = lead.status as keyof typeof funnel;
  
    if (status in funnel) {
      funnel[status]++;
    }
  }
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
    
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Ringkasan aktivitas CRM Xavira.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-6">

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
      <div className="rounded-xl border p-6">
  <h2 className="text-lg font-semibold">
    Follow Up Hari Ini
  </h2>

  <p className="mb-4 text-sm text-muted-foreground">
    Prioritas follow up yang harus dilakukan hari ini.
  </p>

  {todayFollowUps?.length ? (
    <div className="space-y-3">

      {todayFollowUps.map((task: any) => (
        <div
          key={task.id}
          className="rounded-lg border p-4"
        >
          <div className="flex justify-between">

            <div>
              <p className="font-medium">
                {task.leads?.full_name ?? "Lead"}
              </p>

              <p className="text-sm text-muted-foreground">
                {task.title}
              </p>

              <p className="text-xs text-muted-foreground">
                {task.leads?.package_interest ?? "-"}
              </p>
              {(task.leads?.whatsapp_number || task.leads?.phone) && (
  <a
    href={`https://wa.me/${(task.leads.whatsapp_number || task.leads.phone).replace(/\D/g, "")}`}
    target="_blank"
    rel="noreferrer"
    className="mt-2 inline-flex rounded bg-green-600 px-3 py-1 text-xs text-white"
  >
    WhatsApp
  </a>
)}
            </div>

            <div className="text-right text-sm">
              {new Date(task.due_date).toLocaleTimeString(
                "id-ID",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>

          </div>
        </div>
      ))}

    </div>
    
  ) : (
    <p className="text-sm text-muted-foreground">
      Tidak ada follow up hari ini.
    </p>
  )}
</div>

<div className="rounded-xl border p-6">
  <h2 className="text-lg font-semibold">
    Pipeline Summary
  </h2>

  <p className="mb-4 text-sm text-muted-foreground">
    Distribusi lead berdasarkan status pipeline.
  </p>

  <div className="grid gap-3 md:grid-cols-4">

    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">New</p>
      <p className="text-2xl font-bold">{funnel.new}</p>
    </div>

    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">Contacted</p>
      <p className="text-2xl font-bold">{funnel.contacted}</p>
    </div>

    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">Qualified</p>
      <p className="text-2xl font-bold">{funnel.qualified}</p>
    </div>

    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">Proposal</p>
      <p className="text-2xl font-bold">{funnel.proposal_sent}</p>
    </div>

    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">Negotiating</p>
      <p className="text-2xl font-bold">{funnel.negotiating}</p>
    </div>

    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">Won</p>
      <p className="text-2xl font-bold text-green-600">
        {funnel.won}
      </p>
    </div>

    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">Lost</p>
      <p className="text-2xl font-bold text-red-600">
        {funnel.lost}
      </p>
    </div>

  </div>
</div>

<div className="rounded-xl border p-6">
  <h2 className="text-lg font-semibold">
    Paket Terlaris
  </h2>

  <p className="mb-4 text-sm text-muted-foreground">
    Paket yang paling banyak diminati lead.
  </p>

  {topPackages.length ? (
    <div className="space-y-3">
      {topPackages.map(([packageName, total]) => (
        <div
          key={packageName}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <span className="font-medium">
            {packageName}
          </span>

          <span className="text-sm text-muted-foreground">
            {total} Lead
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">
      Belum ada data paket.
    </p>
  )}
</div>
<div className="rounded-xl border p-6">
  <h2 className="text-lg font-semibold">
    Sumber Lead
  </h2>

  <p className="mb-4 text-sm text-muted-foreground">
    Distribusi lead berdasarkan channel akuisisi.
  </p>

  {topSources.length ? (
    <div className="space-y-3">
      {topSources.map(([source, total]) => (
        <div
          key={source}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <span className="capitalize">
            {source.replaceAll("_", " ")}
          </span>

          <span className="text-sm text-muted-foreground">
            {total} Lead
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">
      Belum ada data sumber lead.
    </p>
  )}
</div>
<AiUsageCard
  totalGenerations={aiUsage.totalGenerations}
  inputTokens={aiUsage.inputTokens}
  outputTokens={aiUsage.outputTokens}
  estimatedCostUsd={aiUsage.estimatedCostUsd}
  totalAiTokens={totalAiTokens}
/>
<AiSalesCopilotCard
  leads={topPriorityLeads}
/>
    </div>
  );
}

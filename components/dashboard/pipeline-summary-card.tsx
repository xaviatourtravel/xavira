export type PipelineFunnel = {
  new: number;
  contacted: number;
  qualified: number;
  proposal_sent: number;
  negotiating: number;
  won: number;
  lost: number;
};

type PipelineSummaryCardProps = {
  funnel: PipelineFunnel;
};

export function PipelineSummaryCard({
  funnel,
}: PipelineSummaryCardProps) {
  return (
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
  );
}

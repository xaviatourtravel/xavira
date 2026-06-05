type AiUsageCardProps = {
    totalGenerations: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    totalAiTokens: number;
  };
  
  export function AiUsageCard({
    totalGenerations,
    inputTokens,
    outputTokens,
    estimatedCostUsd,
    totalAiTokens,
  }: AiUsageCardProps) {
    return (
      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">AI Usage</h2>
  
        <p className="mb-4 text-sm text-muted-foreground">
          Ringkasan penggunaan AI untuk organisasi ini.
        </p>
  
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Generate</p>
            <p className="text-2xl font-bold">{totalGenerations}</p>
          </div>
  
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Input Token</p>
            <p className="text-2xl font-bold">{inputTokens}</p>
          </div>
  
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Output Token</p>
            <p className="text-2xl font-bold">{outputTokens}</p>
          </div>
  
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Est. Cost</p>
            <p className="text-2xl font-bold">${estimatedCostUsd.toFixed(4)}</p>
          </div>
        </div>
  
        <p className="mt-3 text-xs text-muted-foreground">
          Total token: {totalAiTokens}
        </p>
      </div>
    );
  }
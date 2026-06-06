type TopPackagesCardProps = {
  topPackages: [string, number][];
};

type TopSourcesCardProps = {
  topSources: [string, number][];
};

type BusinessAnalyticsCardProps = {
  topPackages: [string, number][];
  topSources: [string, number][];
};

export function PaketTerlarisCard({ topPackages }: TopPackagesCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Paket Terlaris</h2>

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
              <span className="font-medium">{packageName}</span>

              <span className="text-sm text-muted-foreground">
                {total} Lead
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada data paket.</p>
      )}
    </div>
  );
}

export function SumberLeadCard({ topSources }: TopSourcesCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Sumber Lead</h2>

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
              <span className="capitalize">{source.replaceAll("_", " ")}</span>

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
  );
}

export function BusinessAnalyticsCard({
  topPackages,
  topSources,
}: BusinessAnalyticsCardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PaketTerlarisCard topPackages={topPackages} />
      <SumberLeadCard topSources={topSources} />
    </div>
  );
}

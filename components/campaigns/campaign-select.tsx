type CampaignSelectProps = {
  campaigns: ReadonlyArray<{ id: string; name: string }>;
  name?: string;
  defaultValue?: string | null;
  className?: string;
};

export function CampaignSelect({
  campaigns,
  name = "campaign_id",
  defaultValue = "",
  className,
}: CampaignSelectProps) {
  return (
    <select name={name} defaultValue={defaultValue ?? ""} className={className}>
      <option value="">Tanpa Campaign</option>
      {campaigns.map((campaign) => (
        <option key={campaign.id} value={campaign.id}>
          {campaign.name}
        </option>
      ))}
    </select>
  );
}

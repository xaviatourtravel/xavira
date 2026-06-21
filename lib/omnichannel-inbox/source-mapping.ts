import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import type { Database } from "@/types/database";

export type OmnichannelLeadSource = Database["public"]["Enums"]["lead_source"];

const CHANNEL_TO_LEAD_SOURCE: Record<OmnichannelChannel, OmnichannelLeadSource> = {
  instagram: "instagram",
  facebook: "facebook",
  whatsapp: "whatsapp",
};

export function mapOmnichannelChannelToLeadSource(
  channel: OmnichannelChannel,
): OmnichannelLeadSource {
  return CHANNEL_TO_LEAD_SOURCE[channel];
}

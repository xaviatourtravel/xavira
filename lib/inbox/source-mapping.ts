import type { InboxSource } from "@/lib/inbox/constants";
import type { Database } from "@/types/database";

export type InboxLeadSource = Database["public"]["Enums"]["lead_source"];

const INBOX_TO_LEAD_SOURCE: Record<InboxSource, InboxLeadSource> = {
  instagram: "instagram",
  facebook: "facebook",
};

export function mapInboxSourceToLeadSource(source: InboxSource): InboxLeadSource {
  return INBOX_TO_LEAD_SOURCE[source];
}

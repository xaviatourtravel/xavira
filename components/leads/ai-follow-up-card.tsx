import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiFollowUpGenerator } from "@/components/leads/ai-follow-up-generator";

type AiFollowUpCardProps = {
  leadId: string;
};

export function AiFollowUpCard({ leadId }: AiFollowUpCardProps) {
  return (
    <Card>
  <CardHeader>
    <CardTitle>AI Follow Up Writer</CardTitle>
    <CardDescription>
      Buat pesan follow up WhatsApp berdasarkan data lead, paket, dan aktivitas terakhir.
    </CardDescription>
  </CardHeader>

  <CardContent>
    <AiFollowUpGenerator leadId={leadId} />
  </CardContent>
</Card>
  );
}

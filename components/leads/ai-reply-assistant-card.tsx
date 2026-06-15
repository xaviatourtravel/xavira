import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiReplyAssistantGenerator } from "@/components/leads/ai-reply-assistant-generator";

type AiReplyAssistantCardProps = {
  leadId: string;
  whatsappNumber: string | null;
  phone: string | null;
};

export function AiReplyAssistantCard({
  leadId,
  whatsappNumber,
  phone,
}: AiReplyAssistantCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Reply Assistant</CardTitle>
        <CardDescription>
          Buat draf balasan WhatsApp berdasarkan konteks lead, paket, aktivitas,
          dan follow up. Pesan tidak dikirim otomatis.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AiReplyAssistantGenerator
          leadId={leadId}
          whatsappNumber={whatsappNumber}
          phone={phone}
        />
      </CardContent>
    </Card>
  );
}

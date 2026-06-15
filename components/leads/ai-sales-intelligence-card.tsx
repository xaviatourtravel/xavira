import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiSalesIntelligencePanel } from "@/components/leads/ai-sales-intelligence-panel";
import type { LeadIntelligenceResult } from "@/lib/ai/lead-intelligence";

type AiSalesIntelligenceCardProps = {
  leadId: string;
  fullName: string;
  packageInterest: string | null;
  whatsappNumber: string | null;
  phone: string | null;
  status: string;
  updatedAt: string;
  hasPendingRecommendedTask: boolean;
  createFollowUpFromRecommendation: (formData: FormData) => Promise<void>;
  initialIntelligence: LeadIntelligenceResult | null;
};

export function AiSalesIntelligenceCard({
  leadId,
  fullName,
  packageInterest,
  whatsappNumber,
  phone,
  status,
  updatedAt,
  hasPendingRecommendedTask,
  createFollowUpFromRecommendation,
  initialIntelligence,
}: AiSalesIntelligenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🧠 AI Sales Intelligence</CardTitle>
        <CardDescription>
          Analisis lead, rekomendasi tindakan, dan pembuatan draf pesan
          WhatsApp dalam satu tempat.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AiSalesIntelligencePanel
          leadId={leadId}
          fullName={fullName}
          packageInterest={packageInterest}
          whatsappNumber={whatsappNumber}
          phone={phone}
          status={status}
          updatedAt={updatedAt}
          hasPendingRecommendedTask={hasPendingRecommendedTask}
          createFollowUpFromRecommendation={createFollowUpFromRecommendation}
          initialIntelligence={initialIntelligence}
        />
      </CardContent>
    </Card>
  );
}

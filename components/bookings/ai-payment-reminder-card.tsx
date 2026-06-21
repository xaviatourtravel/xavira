import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowUpAssistantPanel } from "@/components/ai/follow-up-assistant-panel";
import {
  formatBookingReminderTypeLabel,
  type BookingPaymentReminderType,
} from "@/lib/ai/follow-up-assistant";

type AiPaymentReminderCardProps = {
  bookingId: string;
  leadId: string | null;
  reminderType: BookingPaymentReminderType;
};

export function AiPaymentReminderCard({
  bookingId,
  leadId,
  reminderType,
}: AiPaymentReminderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Payment Reminder</CardTitle>
        <CardDescription>
          Generate payment reminders for DP, partial payments, or final
          settlement. Review and send manually.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FollowUpAssistantPanel
          mode="booking"
          bookingId={bookingId}
          leadId={leadId ?? undefined}
          canSaveNote={Boolean(leadId)}
          generateLabel="Generate Reminder"
          regenerateLabel="Regenerate"
          reminderTypeHint={formatBookingReminderTypeLabel(reminderType)}
        />
      </CardContent>
    </Card>
  );
}

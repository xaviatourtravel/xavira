import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowUpAssistantPanel } from "@/components/ai/follow-up-assistant-panel";

type AiFollowUpAssistantCardProps = {
  leadId: string;
};

export function AiFollowUpAssistantCard({ leadId }: AiFollowUpAssistantCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Follow-Up Assistant</CardTitle>
        <CardDescription>
          Generate contextual follow-up drafts from lead status, conversation,
          and travel details. Nothing is sent automatically.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FollowUpAssistantPanel
          mode="lead"
          leadId={leadId}
          generateLabel="Generate Follow-Up"
          regenerateLabel="Regenerate"
        />
      </CardContent>
    </Card>
  );
}

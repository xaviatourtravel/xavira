import type { AutomationService } from "@/lib/intelligence/automation/service";
import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { EmotionAnalysis } from "@/lib/intelligence/emotion/types";
import type { RecommendationSet } from "@/lib/intelligence/recommendation/types";
import type {
  AutomationDecision,
  AutomationSignals,
} from "@/lib/intelligence/automation/types";
import { AUTOMATION_LABELS } from "@/lib/intelligence/automation/types";

export class StubAutomationService implements AutomationService {
  evaluate(
    context: ConversationContext,
    intent: IntentAnalysis | null,
    emotion: EmotionAnalysis | null,
    recommendation: RecommendationSet,
  ): AutomationSignals {
    const shouldCreateLead =
      !context.hasLinkedLead &&
      (intent?.primary === "ready_to_buy" ||
        intent?.primary === "price_inquiry" ||
        context.incomingMessageCount >= 2);

    const shouldCreateTask =
      recommendation.items.some((item) => item.action === "follow_up") ||
      intent?.primary === "booking";

    const shouldNotifySales =
      emotion?.primary === "urgent" ||
      intent?.primary === "ready_to_buy" ||
      intent?.primary === "complaint";

    const decisions: AutomationDecision[] = [
      {
        signal: "should_create_lead",
        label: AUTOMATION_LABELS.should_create_lead,
        triggered: shouldCreateLead,
        reason: shouldCreateLead
          ? "Prospect showing buying signals without CRM record."
          : "Lead already linked or insufficient intent.",
      },
      {
        signal: "should_create_task",
        label: AUTOMATION_LABELS.should_create_task,
        triggered: shouldCreateTask,
        reason: shouldCreateTask
          ? "Follow-up or booking action recommended."
          : "No immediate task required.",
      },
      {
        signal: "should_notify_sales",
        label: AUTOMATION_LABELS.should_notify_sales,
        triggered: shouldNotifySales,
        reason: shouldNotifySales
          ? "High-priority signal — sales should review now."
          : "Standard queue — no escalation needed.",
      },
    ];

    return { decisions };
  }
}

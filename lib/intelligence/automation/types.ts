export const AUTOMATION_SIGNALS = [
  "should_create_lead",
  "should_create_task",
  "should_notify_sales",
] as const;

export type AutomationSignal = (typeof AUTOMATION_SIGNALS)[number];

export type AutomationDecision = {
  signal: AutomationSignal;
  label: string;
  triggered: boolean;
  reason: string | null;
};

export type AutomationSignals = {
  decisions: AutomationDecision[];
};

export const AUTOMATION_LABELS: Record<AutomationSignal, string> = {
  should_create_lead: "Should Create Lead",
  should_create_task: "Should Create Task",
  should_notify_sales: "Should Notify Sales",
};

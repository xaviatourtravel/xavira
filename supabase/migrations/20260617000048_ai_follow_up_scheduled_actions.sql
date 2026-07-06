-- Scheduled AI actions and FOLLOW_UP_MESSAGE action type.

ALTER TABLE public.ai_actions
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS executed_by_job boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ai_actions_scheduled_due_idx
  ON public.ai_actions (status, scheduled_for)
  WHERE status = 'SCHEDULED';

ALTER TABLE public.ai_actions
  DROP CONSTRAINT IF EXISTS ai_actions_action_type_check;

ALTER TABLE public.ai_actions
  ADD CONSTRAINT ai_actions_action_type_check
  CHECK (
    action_type IN (
      'SEND_DOCUMENT',
      'HANDOVER',
      'CREATE_LEAD_NOTE',
      'UPDATE_MEMORY',
      'UPDATE_LEAD_PROGRESS',
      'SUGGEST_PACKAGE',
      'ASK_QUALIFICATION',
      'FOLLOW_UP_MESSAGE',
      'NO_ACTION'
    )
  );

ALTER TABLE public.ai_actions
  DROP CONSTRAINT IF EXISTS ai_actions_status_check;

ALTER TABLE public.ai_actions
  ADD CONSTRAINT ai_actions_status_check
  CHECK (
    status IN (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'EXECUTED',
      'FAILED',
      'SCHEDULED'
    )
  );

-- Extend brain_action_permissions for FOLLOW_UP_MESSAGE.
ALTER TABLE public.brain_action_permissions
  DROP CONSTRAINT IF EXISTS brain_action_permissions_action_type_valid;

ALTER TABLE public.brain_action_permissions
  ADD CONSTRAINT brain_action_permissions_action_type_valid
  CHECK (
    action_type IN (
      'SEND_DOCUMENT',
      'HANDOVER',
      'CREATE_LEAD_NOTE',
      'UPDATE_MEMORY',
      'UPDATE_LEAD_PROGRESS',
      'SUGGEST_PACKAGE',
      'ASK_QUALIFICATION',
      'FOLLOW_UP_MESSAGE'
    )
  );

INSERT INTO public.brain_action_permissions (
  business_brain_id,
  action_type,
  enabled,
  require_manual_approval,
  minimum_confidence
)
SELECT
  bb.id,
  'FOLLOW_UP_MESSAGE',
  true,
  false,
  0.850
FROM public.business_brains bb
ON CONFLICT (business_brain_id, action_type) DO NOTHING;

-- Follow-up and schedule observability.
ALTER TABLE public.ai_events
  DROP CONSTRAINT IF EXISTS ai_events_event_type_check;

ALTER TABLE public.ai_events
  ADD CONSTRAINT ai_events_event_type_check
  CHECK (
    event_type IN (
      'AI_INTENT_CLASSIFIED',
      'AI_REPLY_SENT',
      'AI_HANDOFF_TRIGGERED',
      'AI_SKIPPED',
      'AI_STATE_CHANGED',
      'AI_LLM_REPLY_STARTED',
      'AI_LLM_REPLY_SENT',
      'AI_LLM_HANDOFF',
      'AI_LLM_FAILED',
      'AI_LLM_SKIPPED',
      'AI_DOCUMENT_SEND_ATTEMPTED',
      'AI_DOCUMENT_SENT',
      'AI_DOCUMENT_FAILED',
      'AI_DOCUMENT_SKIPPED',
      'AI_VALIDATION_PASSED',
      'AI_VALIDATION_FAILED',
      'AI_RESPONSE_SANITIZED',
      'AI_REPLY_QUALITY_CHANGED',
      'AI_REPLY_QUALITY_PASSED',
      'CONTEXT_RETRIEVED',
      'MEMORY_CREATED',
      'MEMORY_UPDATED',
      'MEMORY_USED',
      'MEMORY_EXTRACTION_STARTED',
      'MEMORY_EXTRACTION_COMPLETED',
      'MEMORY_EXTRACTION_SKIPPED',
      'LEAD_QUALIFICATION_UPDATED',
      'ACTION_RECOMMENDED',
      'ACTION_APPROVED',
      'ACTION_REJECTED',
      'ACTION_EXECUTED',
      'ACTION_FAILED',
      'ACTION_MANUALLY_APPROVED',
      'ACTION_MANUALLY_REJECTED',
      'ACTION_EXECUTED_AFTER_APPROVAL',
      'ACTION_PERMISSION_BLOCKED',
      'ACTION_PERMISSION_APPROVED',
      'ACTION_RETRY_ATTEMPTED',
      'ACTION_RETRY_SUCCEEDED',
      'ACTION_RETRY_FAILED',
      'ACTION_SCHEDULED',
      'ACTION_SCHEDULE_EXECUTED',
      'ACTION_SCHEDULE_CANCELLED',
      'ACTION_EXECUTED_NOW',
      'AI_FOLLOW_UP_SCHEDULED',
      'AI_FOLLOW_UP_CANCELLED',
      'AI_FOLLOW_UP_SENT',
      'AI_FOLLOW_UP_SKIPPED'
    )
  );

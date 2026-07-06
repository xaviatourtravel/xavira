-- Retry metadata for failed AI actions.

ALTER TABLE public.ai_actions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_actions
  ADD CONSTRAINT ai_actions_metadata_is_object
  CHECK (jsonb_typeof(metadata) = 'object');

-- Retry observability in ai_events.
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
      'ACTION_RETRY_FAILED'
    )
  );

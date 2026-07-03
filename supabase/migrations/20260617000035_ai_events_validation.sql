-- AI safety validation observability event types

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
      'AI_RESPONSE_SANITIZED'
    )
  );

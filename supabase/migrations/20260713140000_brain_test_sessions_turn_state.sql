-- AI-003.1D: forward-only playground turn-state documentation and JSON integrity.
-- Turn isolation metadata (lastTurnId, lastRequestType) is stored inside
-- brain_test_sessions.conversation_state; no new columns are required.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brain_test_sessions_conversation_state_is_object'
      AND conrelid = 'public.brain_test_sessions'::regclass
  ) THEN
    ALTER TABLE public.brain_test_sessions
      ADD CONSTRAINT brain_test_sessions_conversation_state_is_object
      CHECK (jsonb_typeof(conversation_state) = 'object');
  END IF;
END $$;

COMMENT ON COLUMN public.brain_test_sessions.conversation_state IS
  'Bounded playground planner state JSON: greetingSent, collectedInformation, questionsAsked, selectedEntity, catalogContext, currentIntent, lastRequestType, lastTurnId, handoffRequested, customerMemory, simulatedAttachments';

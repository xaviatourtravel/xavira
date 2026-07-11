-- Add selected entity context to conversation AI state (AI-003.1)

ALTER TABLE public.conversation_ai_state
  ADD COLUMN IF NOT EXISTS selected_entity jsonb;

ALTER TABLE public.conversation_ai_state
  ADD CONSTRAINT conversation_ai_state_selected_entity_object
  CHECK (selected_entity IS NULL OR jsonb_typeof(selected_entity) = 'object');

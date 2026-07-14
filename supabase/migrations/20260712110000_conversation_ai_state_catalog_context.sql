-- Add catalog context to conversation AI state (AI-003.1A)

ALTER TABLE public.conversation_ai_state
  ADD COLUMN IF NOT EXISTS catalog_context jsonb;

ALTER TABLE public.conversation_ai_state
  ADD CONSTRAINT conversation_ai_state_catalog_context_object
  CHECK (catalog_context IS NULL OR jsonb_typeof(catalog_context) = 'object');

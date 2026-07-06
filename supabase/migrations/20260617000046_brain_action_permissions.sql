-- Workspace-level AI action permissions for Business Brain.

CREATE TABLE public.brain_action_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  action_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  require_manual_approval boolean NOT NULL DEFAULT false,
  minimum_confidence numeric(4, 3) NOT NULL DEFAULT 0.500,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_action_permissions_brain_action_unique
    UNIQUE (business_brain_id, action_type),
  CONSTRAINT brain_action_permissions_action_type_valid
    CHECK (
      action_type IN (
        'SEND_DOCUMENT',
        'HANDOVER',
        'CREATE_LEAD_NOTE',
        'UPDATE_MEMORY',
        'UPDATE_LEAD_PROGRESS',
        'SUGGEST_PACKAGE',
        'ASK_QUALIFICATION'
      )
    ),
  CONSTRAINT brain_action_permissions_minimum_confidence_range
    CHECK (minimum_confidence >= 0.500 AND minimum_confidence <= 1.000)
);

CREATE INDEX brain_action_permissions_business_brain_id_idx
  ON public.brain_action_permissions (business_brain_id);

CREATE TRIGGER brain_action_permissions_updated_at
  BEFORE UPDATE ON public.brain_action_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.brain_action_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY brain_action_permissions_select_member
  ON public.brain_action_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_action_permissions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_action_permissions_insert_admin
  ON public.brain_action_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_action_permissions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_action_permissions_update_admin
  ON public.brain_action_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_action_permissions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_action_permissions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_action_permissions_delete_admin
  ON public.brain_action_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_action_permissions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

-- Seed default permissions for existing Business Brains.
INSERT INTO public.brain_action_permissions (
  business_brain_id,
  action_type,
  enabled,
  require_manual_approval,
  minimum_confidence
)
SELECT
  bb.id,
  defaults.action_type,
  defaults.enabled,
  defaults.require_manual_approval,
  defaults.minimum_confidence
FROM public.business_brains bb
CROSS JOIN (
  VALUES
    ('SEND_DOCUMENT', true, false, 0.950),
    ('HANDOVER', true, false, 0.500),
    ('UPDATE_MEMORY', true, false, 0.500),
    ('UPDATE_LEAD_PROGRESS', true, false, 0.500),
    ('CREATE_LEAD_NOTE', true, false, 0.500),
    ('SUGGEST_PACKAGE', true, false, 0.500),
    ('ASK_QUALIFICATION', true, false, 0.500)
) AS defaults (action_type, enabled, require_manual_approval, minimum_confidence)
ON CONFLICT (business_brain_id, action_type) DO NOTHING;

-- Extend ai_events for permission observability.
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
      'ACTION_PERMISSION_APPROVED'
    )
  );

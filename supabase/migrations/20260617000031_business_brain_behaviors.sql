-- Business Brain Behaviors: teach AI how the team works.

CREATE TABLE public.brain_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_behaviors_config_is_object
    CHECK (jsonb_typeof(config) = 'object'),
  CONSTRAINT brain_behaviors_type_valid
    CHECK (
      type IN (
        'ALWAYS_DO',
        'NEVER_DO',
        'HANDOVER_RULE',
        'REPLY_STYLE',
        'QUALIFICATION_RULE'
      )
    )
);

CREATE INDEX brain_behaviors_business_brain_id_idx
  ON public.brain_behaviors (business_brain_id);

CREATE INDEX brain_behaviors_type_idx
  ON public.brain_behaviors (type);

CREATE UNIQUE INDEX brain_behaviors_reply_style_unique
  ON public.brain_behaviors (business_brain_id)
  WHERE type = 'REPLY_STYLE';

CREATE UNIQUE INDEX brain_behaviors_qualification_unique
  ON public.brain_behaviors (business_brain_id)
  WHERE type = 'QUALIFICATION_RULE';

CREATE TRIGGER brain_behaviors_updated_at
  BEFORE UPDATE ON public.brain_behaviors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.brain_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY brain_behaviors_select_member
  ON public.brain_behaviors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_behaviors.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_behaviors_insert_admin
  ON public.brain_behaviors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_behaviors.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_behaviors_update_admin
  ON public.brain_behaviors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_behaviors.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_behaviors.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_behaviors_delete_admin
  ON public.brain_behaviors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_behaviors.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

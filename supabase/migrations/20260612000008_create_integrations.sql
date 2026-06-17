-- Integrations Hub V1: centralized third-party connection registry

CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integrations_status_valid CHECK (
    status IN ('connected', 'not_connected', 'pending_setup')
  ),
  CONSTRAINT integrations_metadata_object CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT integrations_org_provider_unique UNIQUE (organization_id, provider)
);

CREATE INDEX integrations_organization_id_idx
  ON public.integrations (organization_id);

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrations_select_member
  ON public.integrations
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY integrations_insert_admin
  ON public.integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY integrations_update_admin
  ON public.integrations
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY integrations_delete_owner
  ON public.integrations
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_owner()
  );

CREATE TABLE public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'agent',
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_invites_email_not_empty CHECK (length(trim(email)) > 0),
  CONSTRAINT organization_invites_role_not_owner CHECK (role IN ('admin', 'agent')),
  CONSTRAINT organization_invites_status_check CHECK (
    status IN ('pending', 'accepted', 'expired', 'revoked')
  )
);

CREATE INDEX organization_invites_organization_id_idx
  ON public.organization_invites (organization_id, created_at DESC);

CREATE UNIQUE INDEX organization_invites_pending_email_org_idx
  ON public.organization_invites (organization_id, lower(email))
  WHERE status = 'pending';

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_invites_select_admin_or_owner
  ON public.organization_invites
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY organization_invites_insert_admin_or_owner
  ON public.organization_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
    AND role IN ('admin', 'agent')
  );

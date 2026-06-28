-- Allow users to exist without an organization until workspace onboarding completes.

ALTER TABLE public.profiles
  ALTER COLUMN organization_id DROP NOT NULL;

DROP POLICY IF EXISTS profiles_select_org_member ON public.profiles;

CREATE POLICY profiles_select_self_or_org_member
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id = public.get_my_organization_id()
    )
  );

DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;

CREATE POLICY profiles_update_self_or_admin
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id = public.get_my_organization_id()
      AND (
        id = auth.uid()
        OR public.is_org_admin_or_owner()
      )
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id = public.get_my_organization_id()
      AND (
        id = auth.uid()
        OR public.is_org_admin_or_owner()
      )
    )
  );

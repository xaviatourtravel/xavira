-- Allow agents to view unassigned conversations and update assigned ones.

CREATE OR REPLACE FUNCTION public.can_access_omnichannel_conversation(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conv_id
      AND c.organization_id = public.get_my_organization_id()
      AND (
        public.is_org_admin_or_owner()
        OR c.assigned_user_id = auth.uid()
        OR c.assigned_user_id IS NULL
      )
  );
$$;

DROP POLICY IF EXISTS conversations_select_member ON public.conversations;

CREATE POLICY conversations_select_member
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND (
      public.is_org_admin_or_owner()
      OR assigned_user_id = auth.uid()
      OR assigned_user_id IS NULL
    )
  );

CREATE POLICY conversations_update_assigned_agent
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND assigned_user_id = auth.uid()
    AND NOT public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND assigned_user_id = auth.uid()
  );

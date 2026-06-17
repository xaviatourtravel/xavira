-- Allow admin/owner to update AI generation output when editing content board items

CREATE POLICY ai_content_generations_update_admin
  ON public.ai_content_generations
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

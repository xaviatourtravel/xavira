-- AI-001: Atomic Business Brain publish in a single transaction.

CREATE OR REPLACE FUNCTION public.publish_business_brain_atomic(
  p_business_brain_id uuid,
  p_snapshot jsonb,
  p_published_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_brain public.business_brains%ROWTYPE;
  v_next_version integer;
  v_new_version_id uuid;
  v_published_at timestamptz := now();
BEGIN
  IF p_snapshot IS NULL OR jsonb_typeof(p_snapshot) <> 'object' THEN
    RAISE EXCEPTION 'Invalid snapshot payload';
  END IF;

  SELECT *
  INTO v_brain
  FROM public.business_brains
  WHERE id = p_business_brain_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business brain not found';
  END IF;

  IF v_brain.organization_id IS DISTINCT FROM public.get_my_organization_id() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF NOT public.is_org_admin_or_owner() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.brain_versions
  WHERE business_brain_id = p_business_brain_id;

  INSERT INTO public.brain_versions (
    business_brain_id,
    version_number,
    snapshot,
    status,
    published_at,
    published_by
  )
  VALUES (
    p_business_brain_id,
    v_next_version,
    p_snapshot,
    'published',
    v_published_at,
    p_published_by
  )
  RETURNING id INTO v_new_version_id;

  UPDATE public.brain_versions
  SET status = 'superseded'
  WHERE business_brain_id = p_business_brain_id
    AND status = 'published'
    AND id <> v_new_version_id;

  UPDATE public.business_brains
  SET
    status = 'published',
    published_version_id = v_new_version_id,
    published_at = v_published_at,
    published_by = p_published_by,
    draft_updated_at = v_published_at,
    updated_at = v_published_at
  WHERE id = p_business_brain_id;

  RETURN jsonb_build_object(
    'version_id', v_new_version_id,
    'version_number', v_next_version,
    'published_at', v_published_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_business_brain_atomic(uuid, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_business_brain_atomic(uuid, jsonb, uuid) TO authenticated;

-- Rollback:
-- DROP FUNCTION IF EXISTS public.publish_business_brain_atomic(uuid, jsonb, uuid);

-- FIN-001.3A / 1.3A1: Workspace branding (private logo bucket + narrow RPCs)
-- Forward-only. Does not modify applied FIN-001 migrations.
--
-- Authorization model:
-- - Preserve owner-only organizations UPDATE RLS (do NOT widen for admins).
-- - Admins/owners update branding only via SECURITY DEFINER RPCs that mutate
--   approved branding fields and never accept arbitrary settings JSON.

-- ---------------------------------------------------------------------------
-- Ensure restrictive organizations UPDATE remains owner-only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS organizations_update_admin_or_owner ON public.organizations;
DROP POLICY IF EXISTS organizations_update_owner ON public.organizations;
CREATE POLICY organizations_update_owner
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = public.get_my_organization_id()
    AND public.is_org_owner()
  )
  WITH CHECK (
    id = public.get_my_organization_id()
    AND public.is_org_owner()
  );

-- ---------------------------------------------------------------------------
-- Private bucket for workspace brand logos (service-role + signed upload)
-- Paths: {organization_id}/logo/{sha256}.{ext}
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-brand-assets',
  'workspace-brand-assets',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg'];

DROP POLICY IF EXISTS workspace_brand_assets_authenticated_select ON storage.objects;
DROP POLICY IF EXISTS workspace_brand_assets_authenticated_insert ON storage.objects;
DROP POLICY IF EXISTS workspace_brand_assets_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS workspace_brand_assets_authenticated_delete ON storage.objects;
DROP POLICY IF EXISTS workspace_brand_assets_public_read ON storage.objects;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_workspace_branding()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT p.role::text
  INTO v_role
  FROM public.profiles p
  WHERE p.id = v_uid
    AND p.organization_id = public.get_my_organization_id();

  RETURN v_role IN ('owner', 'admin');
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_workspace_branding() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_workspace_branding() TO authenticated;

CREATE OR REPLACE FUNCTION public.normalize_workspace_brand_hex(p_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v text := upper(trim(COALESCE(p_value, '')));
BEGIN
  IF v = '' THEN
    RETURN NULL;
  END IF;
  IF left(v, 1) <> '#' THEN
    v := '#' || v;
  END IF;
  IF v !~ '^#[0-9A-F]{6}$' THEN
    RAISE EXCEPTION 'INVALID_COLOR: Color must be #RRGGBB';
  END IF;
  IF v ~* '(gradient|url\(|rgb\(|hsl\(|var\()' THEN
    RAISE EXCEPTION 'INVALID_COLOR: Color must be #RRGGBB';
  END IF;
  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_workspace_brand_hex(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.assert_workspace_logo_path(
  p_organization_id uuid,
  p_logo_path text,
  p_content_hash text,
  p_mime_type text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_path text := trim(COALESCE(p_logo_path, ''));
  v_hash text := lower(trim(COALESCE(p_content_hash, '')));
  v_ext text;
  v_expected text;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ORG: Organization required';
  END IF;
  IF v_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'INVALID_CONTENT_HASH: Invalid logo content hash';
  END IF;
  IF p_mime_type = 'image/png' THEN
    v_ext := 'png';
  ELSIF p_mime_type = 'image/jpeg' THEN
    v_ext := 'jpg';
  ELSE
    RAISE EXCEPTION 'INVALID_MIME: Only PNG and JPEG logos are allowed';
  END IF;

  v_expected := p_organization_id::text || '/logo/' || v_hash || '.' || v_ext;
  IF v_path <> v_expected THEN
    RAISE EXCEPTION 'PATH_MISMATCH: Logo path must be organization-scoped and hash-bound';
  END IF;
  IF position('..' in v_path) > 0 OR position('\' in v_path) > 0 THEN
    RAISE EXCEPTION 'INVALID_PATH: Logo path is invalid';
  END IF;
  RETURN v_expected;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_workspace_logo_path(uuid, text, text, text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- update_workspace_branding — identity + colors only (no logo, no arbitrary JSON)
-- Organization derived from auth.uid() / get_my_organization_id().
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_workspace_branding(
  p_display_name text,
  p_legal_name text,
  p_tagline text,
  p_address text,
  p_email text,
  p_phone text,
  p_website text,
  p_tax_id text,
  p_primary_color text,
  p_secondary_color text,
  p_accent_color text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid := public.get_my_organization_id();
  v_settings jsonb;
  v_branding jsonb;
  v_primary text;
  v_secondary text;
  v_accent text;
  v_name text;
  v_legal text;
  v_tagline text;
  v_address text;
  v_email text;
  v_phone text;
  v_website text;
  v_tax text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Organization required';
  END IF;
  IF NOT public.can_manage_workspace_branding() THEN
    RAISE EXCEPTION 'FORBIDDEN: Only owners and admins can update workspace branding';
  END IF;

  v_name := nullif(trim(COALESCE(p_display_name, '')), '');
  IF v_name IS NULL OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'INVALID_DISPLAY_NAME: Workspace name is required (max 120)';
  END IF;

  v_primary := public.normalize_workspace_brand_hex(p_primary_color);
  v_secondary := public.normalize_workspace_brand_hex(p_secondary_color);
  v_accent := public.normalize_workspace_brand_hex(p_accent_color);
  IF v_primary IS NULL OR v_secondary IS NULL OR v_accent IS NULL THEN
    RAISE EXCEPTION 'INVALID_COLOR: Primary, secondary, and accent colors are required';
  END IF;

  v_legal := nullif(trim(COALESCE(p_legal_name, '')), '');
  v_tagline := nullif(trim(COALESCE(p_tagline, '')), '');
  v_address := nullif(trim(COALESCE(p_address, '')), '');
  v_email := nullif(trim(COALESCE(p_email, '')), '');
  v_phone := nullif(trim(COALESCE(p_phone, '')), '');
  v_website := nullif(trim(COALESCE(p_website, '')), '');
  v_tax := nullif(trim(COALESCE(p_tax_id, '')), '');

  IF v_legal IS NOT NULL AND char_length(v_legal) > 160 THEN
    RAISE EXCEPTION 'INVALID_FIELD: legal_name too long';
  END IF;
  IF v_tagline IS NOT NULL AND char_length(v_tagline) > 160 THEN
    RAISE EXCEPTION 'INVALID_FIELD: tagline too long';
  END IF;
  IF v_address IS NOT NULL AND char_length(v_address) > 400 THEN
    RAISE EXCEPTION 'INVALID_FIELD: address too long';
  END IF;
  IF v_email IS NOT NULL AND char_length(v_email) > 160 THEN
    RAISE EXCEPTION 'INVALID_FIELD: email too long';
  END IF;
  IF v_phone IS NOT NULL AND char_length(v_phone) > 40 THEN
    RAISE EXCEPTION 'INVALID_FIELD: phone too long';
  END IF;
  IF v_website IS NOT NULL AND char_length(v_website) > 200 THEN
    RAISE EXCEPTION 'INVALID_FIELD: website too long';
  END IF;
  IF v_tax IS NOT NULL AND char_length(v_tax) > 40 THEN
    RAISE EXCEPTION 'INVALID_FIELD: tax_id too long';
  END IF;

  SELECT COALESCE(o.settings, '{}'::jsonb)
  INTO v_settings
  FROM public.organizations o
  WHERE o.id = v_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Preserve existing logo fields; never accept caller branding/settings JSON.
  v_branding := COALESCE(v_settings -> 'branding', '{}'::jsonb);
  v_branding := v_branding
    || jsonb_build_object(
      'legalName', to_jsonb(v_legal),
      'tagline', to_jsonb(v_tagline),
      'address', to_jsonb(v_address),
      'email', to_jsonb(v_email),
      'phone', to_jsonb(v_phone),
      'website', to_jsonb(v_website),
      'taxId', to_jsonb(v_tax),
      'primaryColor', to_jsonb(v_primary),
      'secondaryColor', to_jsonb(v_secondary),
      'accentColor', to_jsonb(v_accent),
      'updatedAt', to_jsonb(timezone('utc', now())::text)
    );

  -- Strip accidental polluted keys if present from legacy data.
  v_branding := v_branding - '__proto__' - 'constructor' - 'prototype';

  v_settings := jsonb_set(v_settings, '{branding}', v_branding, true);
  IF v_email IS NOT NULL THEN
    v_settings := jsonb_set(v_settings, '{businessEmail}', to_jsonb(v_email), true);
  END IF;
  IF v_website IS NOT NULL THEN
    v_settings := jsonb_set(v_settings, '{website}', to_jsonb(v_website), true);
  END IF;
  v_settings := jsonb_set(
    v_settings,
    '{workspace}',
    COALESCE(v_settings -> 'workspace', '{}'::jsonb)
      || jsonb_build_object('brandColor', v_primary),
    true
  );
  v_settings := v_settings - '__proto__' - 'constructor' - 'prototype';

  UPDATE public.organizations o
  SET
    name = v_name,
    phone = v_phone,
    settings = v_settings,
    updated_at = timezone('utc', now())
  WHERE o.id = v_org_id;

  RETURN jsonb_build_object(
    'organizationId', v_org_id,
    'displayName', v_name,
    'branding', v_branding
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_workspace_branding(
  text, text, text, text, text, text, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_workspace_branding(
  text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- ---------------------------------------------------------------------------
-- set_workspace_branding_logo — logo reference only (hash-bound path)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_workspace_branding_logo(
  p_logo_path text,
  p_content_hash text,
  p_mime_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid := public.get_my_organization_id();
  v_settings jsonb;
  v_branding jsonb;
  v_path text;
  v_hash text := lower(trim(COALESCE(p_content_hash, '')));
  v_ref text;
  v_previous text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Organization required';
  END IF;
  IF NOT public.can_manage_workspace_branding() THEN
    RAISE EXCEPTION 'FORBIDDEN: Only owners and admins can update workspace branding';
  END IF;

  v_path := public.assert_workspace_logo_path(
    v_org_id,
    p_logo_path,
    v_hash,
    p_mime_type
  );
  v_ref := 'storage://workspace-brand-assets/' || v_path;

  SELECT COALESCE(o.settings, '{}'::jsonb)
  INTO v_settings
  FROM public.organizations o
  WHERE o.id = v_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  v_branding := COALESCE(v_settings -> 'branding', '{}'::jsonb);
  v_previous := nullif(trim(COALESCE(v_branding ->> 'logoPath', '')), '');

  -- Idempotent: same path+hash already set.
  IF v_previous = v_path
     AND lower(COALESCE(v_branding ->> 'logoContentHash', '')) = v_hash THEN
    RETURN jsonb_build_object(
      'organizationId', v_org_id,
      'logoPath', v_path,
      'previousLogoPath', v_previous,
      'idempotent', true
    );
  END IF;

  v_branding := v_branding
    || jsonb_build_object(
      'logoPath', v_path,
      'logoContentHash', v_hash,
      'logoMimeType', p_mime_type,
      'logoStorageRef', v_ref,
      'logoUrl', v_ref,
      'updatedAt', timezone('utc', now())::text
    );
  v_branding := v_branding - '__proto__' - 'constructor' - 'prototype';

  v_settings := jsonb_set(v_settings, '{branding}', v_branding, true);
  v_settings := jsonb_set(v_settings, '{logoUrl}', to_jsonb(v_ref), true);
  v_settings := v_settings - '__proto__' - 'constructor' - 'prototype';

  UPDATE public.organizations o
  SET
    settings = v_settings,
    updated_at = timezone('utc', now())
  WHERE o.id = v_org_id;

  RETURN jsonb_build_object(
    'organizationId', v_org_id,
    'logoPath', v_path,
    'logoStorageRef', v_ref,
    'previousLogoPath', v_previous,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_workspace_branding_logo(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_workspace_branding_logo(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- clear_workspace_branding_logo — clears only logo reference fields
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clear_workspace_branding_logo()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid := public.get_my_organization_id();
  v_settings jsonb;
  v_branding jsonb;
  v_previous text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Organization required';
  END IF;
  IF NOT public.can_manage_workspace_branding() THEN
    RAISE EXCEPTION 'FORBIDDEN: Only owners and admins can update workspace branding';
  END IF;

  SELECT COALESCE(o.settings, '{}'::jsonb)
  INTO v_settings
  FROM public.organizations o
  WHERE o.id = v_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  v_branding := COALESCE(v_settings -> 'branding', '{}'::jsonb);
  v_previous := nullif(trim(COALESCE(v_branding ->> 'logoPath', '')), '');

  v_branding := jsonb_set(v_branding, '{logoPath}', 'null'::jsonb, true);
  v_branding := jsonb_set(v_branding, '{logoContentHash}', 'null'::jsonb, true);
  v_branding := jsonb_set(v_branding, '{logoMimeType}', 'null'::jsonb, true);
  v_branding := jsonb_set(v_branding, '{logoStorageRef}', 'null'::jsonb, true);
  v_branding := jsonb_set(v_branding, '{logoUrl}', 'null'::jsonb, true);
  v_branding := jsonb_set(
    v_branding,
    '{updatedAt}',
    to_jsonb(timezone('utc', now())::text),
    true
  );
  v_branding := v_branding - '__proto__' - 'constructor' - 'prototype';

  v_settings := jsonb_set(v_settings, '{branding}', v_branding, true);
  v_settings := jsonb_set(v_settings, '{logoUrl}', 'null'::jsonb, true);
  IF (v_settings ? 'workspace') THEN
    v_settings := jsonb_set(
      v_settings,
      '{workspace}',
      (COALESCE(v_settings -> 'workspace', '{}'::jsonb) - 'logoUrl'),
      true
    );
  END IF;
  v_settings := v_settings - '__proto__' - 'constructor' - 'prototype';

  UPDATE public.organizations o
  SET
    settings = v_settings,
    updated_at = timezone('utc', now())
  WHERE o.id = v_org_id;

  RETURN jsonb_build_object(
    'organizationId', v_org_id,
    'previousLogoPath', v_previous
  );
END;
$$;

REVOKE ALL ON FUNCTION public.clear_workspace_branding_logo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_workspace_branding_logo() TO authenticated;

-- ---------------------------------------------------------------------------
-- Issue-time company snapshot: prefer workspace branding, then invoice brand,
-- then organization defaults. Never trusts caller JSON.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.build_invoice_company_snapshot(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations%ROWTYPE;
  v_brand public.invoice_brand_settings%ROWTYPE;
  v_settings jsonb;
  v_branding jsonb;
  v_logo text;
BEGIN
  SELECT * INTO v_org FROM public.organizations WHERE id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  SELECT * INTO v_brand
  FROM public.invoice_brand_settings
  WHERE organization_id = p_organization_id;

  v_settings := COALESCE(v_org.settings, '{}'::jsonb);
  v_branding := COALESCE(v_settings -> 'branding', '{}'::jsonb);

  v_logo := nullif(trim(COALESCE(v_branding ->> 'logoStorageRef', '')), '');
  IF v_logo IS NULL THEN
    v_logo := nullif(trim(COALESCE(v_branding ->> 'logoUrl', '')), '');
  END IF;
  IF v_logo IS NULL THEN
    v_logo := nullif(trim(COALESCE(v_brand.logo_url, '')), '');
  END IF;
  IF v_logo IS NULL THEN
    v_logo := nullif(trim(COALESCE(v_settings ->> 'logoUrl', '')), '');
  END IF;

  RETURN jsonb_build_object(
    'legalName', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'legalName', '')), ''),
      v_brand.legal_name,
      v_org.name
    ),
    'logoUrl', v_logo,
    'address', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'address', '')), ''),
      v_brand.address
    ),
    'email', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'email', '')), ''),
      v_brand.email,
      v_settings ->> 'businessEmail'
    ),
    'phone', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'phone', '')), ''),
      v_brand.phone,
      v_org.phone
    ),
    'website', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'website', '')), ''),
      v_brand.website,
      v_settings ->> 'website'
    ),
    'taxId', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'taxId', '')), ''),
      v_brand.tax_id
    ),
    'paymentAccounts', COALESCE(v_brand.payment_accounts_json, '[]'::jsonb),
    'primaryColor', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'primaryColor', '')), ''),
      v_brand.primary_color,
      '#0F172A'
    ),
    'secondaryColor', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'secondaryColor', '')), ''),
      v_brand.secondary_color,
      '#64748B'
    ),
    'accentColor', COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'accentColor', '')), ''),
      v_brand.accent_color,
      '#0EA5E9'
    ),
    'footerText', v_brand.footer_text,
    'tagline', nullif(trim(COALESCE(v_branding ->> 'tagline', '')), '')
  );
END;
$$;

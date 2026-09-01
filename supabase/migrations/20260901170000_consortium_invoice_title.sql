-- UX-001: Consortium customer-facing official invoice title is INVOICE.
-- Does not modify 20260901120000 or 20260901150000 (already applied).
-- Does not mutate issued invoices.brand_snapshot.

UPDATE public.invoice_brand_profiles
SET invoice_title = 'INVOICE'
WHERE key = 'consortium'
  AND invoice_title = 'CONSORTIUM INVOICE';

CREATE OR REPLACE FUNCTION public.seed_invoice_brand_profiles_for_org(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
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
  SELECT * INTO v_org FROM public.organizations WHERE id = p_org_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT * INTO v_brand
  FROM public.invoice_brand_settings
  WHERE organization_id = p_org_id;

  v_settings := COALESCE(v_org.settings, '{}'::jsonb);
  v_branding := COALESCE(v_settings -> 'branding', '{}'::jsonb);

  v_logo := nullif(trim(COALESCE(v_branding ->> 'logoStorageRef', '')), '');
  IF v_logo IS NULL THEN
    v_logo := nullif(trim(COALESCE(v_brand.logo_url, '')), '');
  END IF;

  INSERT INTO public.invoice_brand_profiles (
    organization_id,
    key,
    name,
    display_name,
    legal_name,
    logo_path,
    logo_content_hash,
    logo_storage_ref,
    primary_color,
    secondary_color,
    accent_color,
    address,
    email,
    phone,
    website,
    tax_id,
    footer_text,
    payment_accounts_json,
    invoice_prefix,
    invoice_title,
    is_default,
    is_active
  )
  VALUES (
    p_org_id,
    'xavia',
    'Xavia',
    'Xavia',
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'legalName', '')), ''),
      v_brand.legal_name,
      v_org.name
    ),
    nullif(trim(COALESCE(v_branding ->> 'logoPath', '')), ''),
    nullif(trim(COALESCE(v_branding ->> 'logoContentHash', '')), ''),
    v_logo,
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'primaryColor', '')), ''),
      v_brand.primary_color,
      '#0F172A'
    ),
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'secondaryColor', '')), ''),
      v_brand.secondary_color,
      '#64748B'
    ),
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'accentColor', '')), ''),
      v_brand.accent_color,
      '#0EA5E9'
    ),
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'address', '')), ''),
      v_brand.address
    ),
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'email', '')), ''),
      v_brand.email,
      v_settings ->> 'businessEmail'
    ),
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'phone', '')), ''),
      v_brand.phone,
      v_org.phone
    ),
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'website', '')), ''),
      v_brand.website,
      v_settings ->> 'website'
    ),
    COALESCE(
      nullif(trim(COALESCE(v_branding ->> 'taxId', '')), ''),
      v_brand.tax_id
    ),
    v_brand.footer_text,
    COALESCE(v_brand.payment_accounts_json, '[]'::jsonb),
    'INV/XAV',
    'INVOICE',
    true,
    true
  )
  ON CONFLICT (organization_id, key) DO UPDATE
  SET
    invoice_prefix = COALESCE(
      nullif(trim(public.invoice_brand_profiles.invoice_prefix), ''),
      EXCLUDED.invoice_prefix
    ),
    invoice_title = COALESCE(
      nullif(trim(public.invoice_brand_profiles.invoice_title), ''),
      EXCLUDED.invoice_title
    );

  INSERT INTO public.invoice_brand_profiles (
    organization_id,
    key,
    name,
    display_name,
    legal_name,
    primary_color,
    secondary_color,
    accent_color,
    payment_accounts_json,
    invoice_prefix,
    invoice_title,
    is_default,
    is_active
  )
  VALUES (
    p_org_id,
    'consortium',
    'Consortium',
    'Consortium',
    'Consortium',
    '#1E3A5F',
    '#64748B',
    '#C9A227',
    '[]'::jsonb,
    'INV/CON',
    'INVOICE',
    false,
    true
  )
  ON CONFLICT (organization_id, key) DO UPDATE
  SET
    invoice_prefix = COALESCE(
      nullif(trim(public.invoice_brand_profiles.invoice_prefix), ''),
      EXCLUDED.invoice_prefix
    ),
    invoice_title = COALESCE(
      nullif(trim(public.invoice_brand_profiles.invoice_title), ''),
      EXCLUDED.invoice_title
    );
END;
$$;

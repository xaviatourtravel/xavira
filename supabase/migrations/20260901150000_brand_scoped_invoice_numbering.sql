-- FIN-006A: Brand-scoped official invoice numbering, invoice title, and prefixes.
-- Does not modify 20260901120000_invoice_brand_profiles.sql (already applied).
-- Proforma PI-YYYY-NNNNNN sequences are unchanged.

-- ---------------------------------------------------------------------------
-- Brand document title + activate invoice_prefix
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_brand_profiles
  ADD COLUMN IF NOT EXISTS invoice_title text;

UPDATE public.invoice_brand_profiles
SET invoice_title = 'INVOICE'
WHERE invoice_title IS NULL AND key = 'xavia';

UPDATE public.invoice_brand_profiles
SET invoice_title = 'CONSORTIUM INVOICE'
WHERE invoice_title IS NULL AND key = 'consortium';

UPDATE public.invoice_brand_profiles
SET invoice_title = 'INVOICE'
WHERE invoice_title IS NULL;

ALTER TABLE public.invoice_brand_profiles
  ALTER COLUMN invoice_title SET DEFAULT 'INVOICE',
  ALTER COLUMN invoice_title SET NOT NULL;

ALTER TABLE public.invoice_brand_profiles
  DROP CONSTRAINT IF EXISTS invoice_brand_profiles_invoice_title_check;

ALTER TABLE public.invoice_brand_profiles
  ADD CONSTRAINT invoice_brand_profiles_invoice_title_check CHECK (
    char_length(trim(invoice_title)) BETWEEN 1 AND 80
  );

ALTER TABLE public.invoice_brand_profiles
  DROP CONSTRAINT IF EXISTS invoice_brand_profiles_invoice_prefix_check;

-- Update prefixes before adding the stricter CHECK so legacy values like INV
-- cannot block the migration.
UPDATE public.invoice_brand_profiles
SET invoice_prefix = 'INV/XAV'
WHERE key = 'xavia'
  AND (invoice_prefix IS NULL OR invoice_prefix !~ '^[A-Z0-9]+(/[A-Z0-9]+)+$');

UPDATE public.invoice_brand_profiles
SET invoice_prefix = 'INV/CON'
WHERE key = 'consortium'
  AND (invoice_prefix IS NULL OR invoice_prefix !~ '^[A-Z0-9]+(/[A-Z0-9]+)+$');

-- Allow INV/XAV style prefixes. Letters, numbers, and internal slashes only.
ALTER TABLE public.invoice_brand_profiles
  ADD CONSTRAINT invoice_brand_profiles_invoice_prefix_check CHECK (
    invoice_prefix IS NULL
    OR (
      char_length(invoice_prefix) BETWEEN 5 AND 24
      AND invoice_prefix ~ '^[A-Z0-9]+(/[A-Z0-9]+)+$'
    )
  );

COMMENT ON COLUMN public.invoice_brand_profiles.invoice_prefix IS
  'Official invoice prefix, e.g. INV/XAV. Numbers are {prefix}/{year}/{NNNN}.';
COMMENT ON COLUMN public.invoice_brand_profiles.invoice_title IS
  'Customer-facing official invoice heading. Frozen into brand_snapshot at issue.';
COMMENT ON TABLE public.invoice_brand_profiles IS
  'Per-workspace commercial identities. Official invoice numbers are brand-scoped.';

-- ---------------------------------------------------------------------------
-- invoice_sequences: add brand column (nullable until profiles are seeded)
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_sequences
  ADD COLUMN IF NOT EXISTS brand_profile_id uuid
    REFERENCES public.invoice_brand_profiles (id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- Seed: include title + prefix for new organizations
-- ---------------------------------------------------------------------------
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
    'CONSORTIUM INVOICE',
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

DO $$
DECLARE
  v_org record;
BEGIN
  FOR v_org IN SELECT id FROM public.organizations LOOP
    PERFORM public.seed_invoice_brand_profiles_for_org(v_org.id);
  END LOOP;
END;
$$;

UPDATE public.invoice_brand_profiles
SET invoice_prefix = 'INV/XAV'
WHERE key = 'xavia'
  AND (invoice_prefix IS NULL OR invoice_prefix !~ '^[A-Z0-9]+(/[A-Z0-9]+)+$');

UPDATE public.invoice_brand_profiles
SET invoice_prefix = 'INV/CON'
WHERE key = 'consortium'
  AND (invoice_prefix IS NULL OR invoice_prefix !~ '^[A-Z0-9]+(/[A-Z0-9]+)+$');

ALTER TABLE public.invoice_brand_profiles
  ALTER COLUMN invoice_prefix SET NOT NULL;

DROP INDEX IF EXISTS invoice_brand_profiles_org_active_prefix_unique;
CREATE UNIQUE INDEX invoice_brand_profiles_org_active_prefix_unique
  ON public.invoice_brand_profiles (organization_id, invoice_prefix)
  WHERE is_active;

-- Existing org/year last_number is inherited by Xavia. Consortium starts at 0001
-- on first issue (no sequence row until then).
UPDATE public.invoice_sequences s
SET brand_profile_id = p.id
FROM public.invoice_brand_profiles p
WHERE p.organization_id = s.organization_id
  AND p.key = 'xavia'
  AND s.brand_profile_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.invoice_sequences WHERE brand_profile_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'invoice_sequences.brand_profile_id backfill incomplete; refusing to drop sequence state';
  END IF;
END;
$$;

ALTER TABLE public.invoice_sequences
  ALTER COLUMN brand_profile_id SET NOT NULL;

ALTER TABLE public.invoice_sequences
  DROP CONSTRAINT IF EXISTS invoice_sequences_org_year_unique;

DROP INDEX IF EXISTS invoice_sequences_org_year_unique;
DROP INDEX IF EXISTS invoice_sequences_org_brand_year_unique;

ALTER TABLE public.invoice_sequences
  DROP CONSTRAINT IF EXISTS invoice_sequences_org_brand_year_unique;

ALTER TABLE public.invoice_sequences
  ADD CONSTRAINT invoice_sequences_org_brand_year_unique
  UNIQUE (organization_id, brand_profile_id, year);

-- ---------------------------------------------------------------------------
-- Snapshot includes invoice title and prefix
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.freeze_invoice_brand_snapshot(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.invoice_brand_profiles%ROWTYPE;
  v_accounts jsonb;
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_profile
  FROM public.invoice_brand_profiles
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_accounts := COALESCE(v_profile.payment_accounts_json, '[]'::jsonb);

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'key', v_profile.key,
    'name', v_profile.name,
    'displayName', v_profile.display_name,
    'legalName', v_profile.legal_name,
    'logoUrl', v_profile.logo_storage_ref,
    'logoPath', v_profile.logo_path,
    'primaryColor', COALESCE(v_profile.primary_color, '#0F172A'),
    'secondaryColor', COALESCE(v_profile.secondary_color, '#64748B'),
    'accentColor', COALESCE(v_profile.accent_color, '#0EA5E9'),
    'address', v_profile.address,
    'email', v_profile.email,
    'phone', v_profile.phone,
    'website', v_profile.website,
    'taxId', v_profile.tax_id,
    'footerText', v_profile.footer_text,
    'paymentAccounts', v_accounts,
    'invoiceTitle', COALESCE(nullif(trim(v_profile.invoice_title), ''), 'INVOICE'),
    'invoicePrefix', v_profile.invoice_prefix,
    'fixedLayout', true,
    'layoutKey', 'calm-standard',
    'snapshotAt', now()
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Allocate one official number from the org+brand+year row (transactional).
-- Uses the existing invoice_sequences row table with FOR UPDATE.
-- Never accepts a caller-supplied sequence.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_brand_invoice_number(
  p_organization_id uuid,
  p_brand_profile_id uuid,
  p_year integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix text;
  v_next_number integer;
BEGIN
  IF p_organization_id IS NULL OR p_brand_profile_id IS NULL OR p_year IS NULL THEN
    RAISE EXCEPTION 'Brand invoice number allocation requires organization, brand, and year';
  END IF;

  SELECT invoice_prefix
  INTO v_prefix
  FROM public.invoice_brand_profiles
  WHERE id = p_brand_profile_id
    AND organization_id = p_organization_id
    AND is_active
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finance brand not found for invoice numbering';
  END IF;

  v_prefix := upper(trim(v_prefix));
  IF v_prefix IS NULL
    OR char_length(v_prefix) < 5
    OR v_prefix !~ '^[A-Z0-9]+(/[A-Z0-9]+)+$' THEN
    RAISE EXCEPTION 'Finance brand is missing a valid invoice prefix';
  END IF;

  INSERT INTO public.invoice_sequences (
    organization_id,
    brand_profile_id,
    year,
    prefix,
    last_number
  )
  VALUES (
    p_organization_id,
    p_brand_profile_id,
    p_year,
    v_prefix,
    0
  )
  ON CONFLICT (organization_id, brand_profile_id, year) DO NOTHING;

  SELECT s.last_number + 1
  INTO v_next_number
  FROM public.invoice_sequences s
  WHERE s.organization_id = p_organization_id
    AND s.brand_profile_id = p_brand_profile_id
    AND s.year = p_year
  FOR UPDATE;

  UPDATE public.invoice_sequences
  SET last_number = v_next_number
  WHERE organization_id = p_organization_id
    AND brand_profile_id = p_brand_profile_id
    AND year = p_year;

  RETURN format(
    '%s/%s/%s',
    v_prefix,
    p_year::text,
    lpad(v_next_number::text, 4, '0')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_brand_invoice_number(uuid, uuid, integer) FROM PUBLIC;
-- Invoked only by issue_invoice (SECURITY DEFINER). Clients must not allocate.

-- ---------------------------------------------------------------------------
-- issue_invoice: brand-scoped number + freeze title/prefix in snapshot
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_invoice(p_invoice_id uuid)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices;
  v_org_id uuid;
  v_brand_id uuid;
  v_year integer;
  v_invoice_number text;
  v_issue_date date;
  v_company jsonb;
  v_customer jsonb;
  v_booking jsonb;
  v_theme jsonb;
  v_template text;
  v_template_version integer;
  v_brand_snapshot jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_invoice_id IS NULL THEN
    RAISE EXCEPTION 'Invoice id is required';
  END IF;

  SELECT *
  INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  v_org_id := v_invoice.organization_id;

  IF NOT public.can_manage_invoices(v_org_id) THEN
    RAISE EXCEPTION 'Not authorized to issue invoices for this organization';
  END IF;

  IF v_invoice.lifecycle_status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft invoices can be issued';
  END IF;

  IF v_invoice.invoice_number IS NOT NULL THEN
    RAISE EXCEPTION 'Draft invoices must not already have an invoice number';
  END IF;

  IF v_invoice.recipient_source = 'manual' THEN
    IF v_invoice.customer_id IS NOT NULL OR v_invoice.booking_id IS NOT NULL THEN
      RAISE EXCEPTION 'Manual recipient invoices cannot link customer or booking';
    END IF;
    IF v_invoice.manual_recipient_name IS NULL
      OR length(trim(v_invoice.manual_recipient_name)) = 0 THEN
      RAISE EXCEPTION 'Manual recipient name is required';
    END IF;
    v_booking := NULL;
  ELSE
    IF v_invoice.customer_id IS NULL THEN
      RAISE EXCEPTION 'Linked customer invoices require a customer';
    END IF;
    v_booking := public.build_invoice_booking_snapshot(
      v_org_id,
      v_invoice.booking_id,
      v_invoice.customer_id
    );
  END IF;

  PERFORM 1
  FROM public.invoice_items ii
  WHERE ii.invoice_id = p_invoice_id
  ORDER BY ii.sort_order, ii.id
  FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_items ii WHERE ii.invoice_id = p_invoice_id
  ) THEN
    RAISE EXCEPTION 'Invoice must have at least one line item before issue';
  END IF;

  IF v_invoice.invoice_type = 'ticketing' THEN
    PERFORM public.lock_and_validate_ticketing_for_issue(p_invoice_id);
  ELSIF EXISTS (
    SELECT 1 FROM public.invoice_ticket_groups g WHERE g.invoice_id = p_invoice_id
  ) THEN
    RAISE EXCEPTION 'Package invoices cannot carry ticket data';
  END IF;

  v_customer := public.build_invoice_customer_snapshot_from_invoice(v_invoice.id);

  v_brand_id := v_invoice.brand_profile_id;
  IF v_brand_id IS NULL THEN
    SELECT id
    INTO v_brand_id
    FROM public.invoice_brand_profiles
    WHERE organization_id = v_org_id
      AND is_default
      AND is_active
    ORDER BY key
    LIMIT 1;
  END IF;
  IF v_brand_id IS NULL THEN
    SELECT id
    INTO v_brand_id
    FROM public.invoice_brand_profiles
    WHERE organization_id = v_org_id
      AND key = 'xavia'
      AND is_active
    LIMIT 1;
  END IF;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Finance brand is required to issue an invoice';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.invoice_brand_profiles p
    WHERE p.id = v_brand_id
      AND p.organization_id = v_org_id
      AND p.is_active
  ) THEN
    RAISE EXCEPTION 'Finance brand does not belong to this organization';
  END IF;

  v_company := public.build_invoice_company_snapshot_from_brand(v_brand_id);
  v_brand_snapshot := public.freeze_invoice_brand_snapshot(v_brand_id);
  v_template := 'calm-standard';
  v_template_version := 2;
  v_theme := jsonb_build_object(
    'templateKey', v_template,
    'templateVersion', v_template_version,
    'primaryColor', v_brand_snapshot ->> 'primaryColor',
    'secondaryColor', v_brand_snapshot ->> 'secondaryColor',
    'accentColor', v_brand_snapshot ->> 'accentColor'
  );

  IF v_invoice.source_proforma_id IS NOT NULL THEN
    SELECT s.customer_snapshot, s.booking_snapshot
    INTO v_customer, v_booking
    FROM public.proforma_document_snapshots_for_issue(v_invoice.id) s;
  END IF;

  PERFORM public.recalculate_invoice_totals(v_invoice.id);

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;

  v_issue_date := COALESCE(v_invoice.issue_date, (now() AT TIME ZONE 'Asia/Jakarta')::date);
  v_year := EXTRACT(YEAR FROM v_issue_date)::integer;

  -- Brand-scoped numbering. Prefix comes from the trusted brand row, not the client.
  v_invoice_number := public.allocate_brand_invoice_number(
    v_org_id,
    v_brand_id,
    v_year
  );

  PERFORM set_config('app.trusted_invoice_pdf', '1', true);

  UPDATE public.invoices
  SET
    invoice_number = v_invoice_number,
    lifecycle_status = 'issued',
    issue_date = v_issue_date,
    brand_profile_id = v_brand_id,
    company_snapshot = v_company,
    customer_snapshot = v_customer,
    booking_snapshot = v_booking,
    theme_snapshot = v_theme,
    template_key = v_template,
    template_version = v_template_version,
    brand_snapshot = v_brand_snapshot,
    pdf_status = 'not_generated',
    pdf_generated_at = NULL,
    pdf_error_code = NULL,
    pdf_storage_path = NULL,
    pdf_generation_token = NULL,
    pdf_generation_claimed_at = NULL,
    logo_asset_path = NULL,
    logo_content_hash = NULL,
    issued_at = now(),
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_org_id,
    v_invoice.id,
    'INVOICE_ISSUED',
    jsonb_build_object(
      'invoice_number', v_invoice.invoice_number,
      'total_minor', v_invoice.total_minor,
      'recipient_source', v_invoice.recipient_source,
      'invoice_prefix', v_brand_snapshot ->> 'invoicePrefix',
      'template_key', v_template,
      'invoice_type', v_invoice.invoice_type,
      'document_type', v_invoice.document_type,
      'brand_key', v_brand_snapshot ->> 'key',
      'invoice_title', v_brand_snapshot ->> 'invoiceTitle'
    )
  );

  RETURN v_invoice;
END;
$$;

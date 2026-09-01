-- FIN-006: Multi-brand finance identity (Xavia / Consortium)
-- Numbering remains workspace-shared (invoice_brand_settings.invoice_prefix
-- and proforma_sequences). Brand profiles do not allocate INV/PI numbers.
-- New package/proforma documents use the fixed calm-standard layout.
-- Issued historical invoices keep template_key rendering.

-- ---------------------------------------------------------------------------
-- Brand profiles
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  display_name text NOT NULL,
  legal_name text,
  logo_path text,
  logo_content_hash text,
  logo_storage_ref text,
  primary_color text NOT NULL DEFAULT '#0F172A',
  secondary_color text NOT NULL DEFAULT '#64748B',
  accent_color text NOT NULL DEFAULT '#0EA5E9',
  address text,
  email text,
  phone text,
  website text,
  tax_id text,
  footer_text text,
  payment_accounts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  invoice_prefix text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_brand_profiles_key_format CHECK (
    key ~ '^[a-z0-9][a-z0-9-]{1,31}$'
  ),
  CONSTRAINT invoice_brand_profiles_org_key_unique UNIQUE (organization_id, key),
  CONSTRAINT invoice_brand_profiles_invoice_prefix_check CHECK (
    invoice_prefix IS NULL
    OR (
      char_length(invoice_prefix) BETWEEN 2 AND 10
      AND invoice_prefix ~ '^[A-Z0-9]+$'
    )
  )
);

CREATE UNIQUE INDEX invoice_brand_profiles_one_default_per_org
  ON public.invoice_brand_profiles (organization_id)
  WHERE is_default;

CREATE INDEX invoice_brand_profiles_org_active_idx
  ON public.invoice_brand_profiles (organization_id, is_active);

CREATE TRIGGER invoice_brand_profiles_updated_at
  BEFORE UPDATE ON public.invoice_brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.invoice_brand_profiles IS
  'Per-workspace commercial identities for invoices and proformas. Numbering stays workspace-shared.';
COMMENT ON COLUMN public.invoice_brand_profiles.invoice_prefix IS
  'Reserved. FIN-006 does not allocate invoice numbers from this column.';

ALTER TABLE public.invoice_brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_brand_profiles_select_member
  ON public.invoice_brand_profiles
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY invoice_brand_profiles_insert_manager
  ON public.invoice_brand_profiles
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

CREATE POLICY invoice_brand_profiles_update_manager
  ON public.invoice_brand_profiles
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

CREATE POLICY invoice_brand_profiles_delete_manager
  ON public.invoice_brand_profiles
  FOR DELETE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

-- ---------------------------------------------------------------------------
-- Document pointers + frozen snapshots
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS brand_profile_id uuid
    REFERENCES public.invoice_brand_profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_snapshot jsonb;

ALTER TABLE public.proforma_invoices
  ADD COLUMN IF NOT EXISTS brand_profile_id uuid
    REFERENCES public.invoice_brand_profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_snapshot jsonb;

CREATE INDEX invoices_brand_profile_id_idx
  ON public.invoices (brand_profile_id)
  WHERE brand_profile_id IS NOT NULL;

CREATE INDEX proforma_invoices_brand_profile_id_idx
  ON public.proforma_invoices (brand_profile_id)
  WHERE brand_profile_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Snapshot helpers
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
    'fixedLayout', true,
    'layoutKey', 'calm-standard',
    'snapshotAt', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.build_invoice_company_snapshot_from_brand(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_snap jsonb;
BEGIN
  v_snap := public.freeze_invoice_brand_snapshot(p_profile_id);
  IF v_snap IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'legalName', v_snap ->> 'legalName',
    'logoUrl', v_snap ->> 'logoUrl',
    'address', v_snap ->> 'address',
    'email', v_snap ->> 'email',
    'phone', v_snap ->> 'phone',
    'website', v_snap ->> 'website',
    'taxId', v_snap ->> 'taxId',
    'paymentAccounts', COALESCE(v_snap -> 'paymentAccounts', '[]'::jsonb),
    'primaryColor', v_snap ->> 'primaryColor',
    'secondaryColor', v_snap ->> 'secondaryColor',
    'accentColor', v_snap ->> 'accentColor',
    'footerText', v_snap ->> 'footerText'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.freeze_invoice_brand_snapshot(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.freeze_invoice_brand_snapshot(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.build_invoice_company_snapshot_from_brand(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.build_invoice_company_snapshot_from_brand(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed Xavia (from workspace + invoice brand settings) and Consortium
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
    true,
    true
  )
  ON CONFLICT (organization_id, key) DO NOTHING;

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
    false,
    true
  )
  ON CONFLICT (organization_id, key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_invoice_brand_profiles_for_org(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_invoice_brand_profiles_for_org(uuid) TO authenticated;

DO $$
DECLARE
  v_org record;
BEGIN
  FOR v_org IN SELECT id FROM public.organizations LOOP
    PERFORM public.seed_invoice_brand_profiles_for_org(v_org.id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_seed_invoice_brand_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.seed_invoice_brand_profiles_for_org(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_seed_invoice_brand_profiles ON public.organizations;
CREATE TRIGGER organizations_seed_invoice_brand_profiles
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_seed_invoice_brand_profiles();

-- Draft documents only: attach default Xavia and pin the fixed layout.
-- Issued/historical invoices keep template_key and are not rewritten.
UPDATE public.invoices i
SET
  brand_profile_id = p.id,
  brand_snapshot = public.freeze_invoice_brand_snapshot(p.id),
  template_key = 'calm-standard',
  template_version = 2,
  theme_snapshot = COALESCE(i.theme_snapshot, '{}'::jsonb) || jsonb_build_object(
    'templateKey', 'calm-standard',
    'templateVersion', 2
  )
FROM public.invoice_brand_profiles p
WHERE p.organization_id = i.organization_id
  AND p.key = 'xavia'
  AND i.lifecycle_status = 'draft'
  AND i.brand_profile_id IS NULL;

UPDATE public.proforma_invoices pf
SET
  brand_profile_id = p.id,
  brand_snapshot = public.freeze_invoice_brand_snapshot(p.id),
  template_key = 'calm-standard',
  template_version = 2,
  theme_snapshot = COALESCE(pf.theme_snapshot, '{}'::jsonb) || jsonb_build_object(
    'templateKey', 'calm-standard',
    'templateVersion', 2
  )
FROM public.invoice_brand_profiles p
WHERE p.organization_id = pf.organization_id
  AND p.key = 'xavia'
  AND pf.lifecycle_status = 'draft'
  AND pf.brand_profile_id IS NULL;

-- ---------------------------------------------------------------------------
-- issue_invoice: freeze selected brand at issue time (not workspace branding)
-- Number allocation is unchanged (workspace prefix + org-year sequence).
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
  v_number_code text;
  v_year integer;
  v_next_number integer;
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

  IF v_invoice.brand_profile_id IS NOT NULL THEN
    v_company := public.build_invoice_company_snapshot_from_brand(v_invoice.brand_profile_id);
    v_brand_snapshot := public.freeze_invoice_brand_snapshot(v_invoice.brand_profile_id);
    v_template := 'calm-standard';
    v_template_version := 2;
    v_theme := jsonb_build_object(
      'templateKey', v_template,
      'templateVersion', v_template_version,
      'primaryColor', v_brand_snapshot ->> 'primaryColor',
      'secondaryColor', v_brand_snapshot ->> 'secondaryColor',
      'accentColor', v_brand_snapshot ->> 'accentColor'
    );
  ELSE
    v_company := public.build_invoice_company_snapshot(v_org_id);
    v_brand_snapshot := v_invoice.brand_snapshot;
    v_theme := public.build_invoice_theme_snapshot_from_invoice(v_invoice.id);
    v_template := public.normalize_invoice_template_key(v_theme ->> 'templateKey');
    v_template_version := COALESCE((v_theme ->> 'templateVersion')::integer, 1);
    v_theme := v_theme || jsonb_build_object(
      'templateKey', v_template,
      'templateVersion', v_template_version
    );
  END IF;

  IF v_invoice.source_proforma_id IS NOT NULL THEN
    SELECT s.customer_snapshot, s.booking_snapshot
    INTO v_customer, v_booking
    FROM public.proforma_document_snapshots_for_issue(v_invoice.id) s;
  END IF;

  PERFORM public.recalculate_invoice_totals(v_invoice.id);

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;

  -- Shared workspace numbering. Brand invoice_prefix is not used.
  v_number_code := public.resolve_invoice_number_code(v_org_id);

  v_issue_date := COALESCE(v_invoice.issue_date, (now() AT TIME ZONE 'Asia/Jakarta')::date);
  v_year := EXTRACT(YEAR FROM v_issue_date)::integer;

  INSERT INTO public.invoice_sequences (organization_id, year, prefix, last_number)
  VALUES (v_org_id, v_year, 'INV', 0)
  ON CONFLICT (organization_id, year) DO NOTHING;

  SELECT s.last_number + 1
  INTO v_next_number
  FROM public.invoice_sequences s
  WHERE s.organization_id = v_org_id
    AND s.year = v_year
  FOR UPDATE;

  UPDATE public.invoice_sequences
  SET last_number = v_next_number
  WHERE organization_id = v_org_id
    AND year = v_year;

  v_invoice_number := format(
    'INV/%s/%s/%s',
    v_number_code,
    v_year::text,
    lpad(v_next_number::text, 4, '0')
  );

  PERFORM set_config('app.trusted_invoice_pdf', '1', true);

  UPDATE public.invoices
  SET
    invoice_number = v_invoice_number,
    lifecycle_status = 'issued',
    issue_date = v_issue_date,
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
      'number_code', v_number_code,
      'template_key', v_template,
      'invoice_type', v_invoice.invoice_type,
      'document_type', v_invoice.document_type,
      'brand_key', v_brand_snapshot ->> 'key'
    )
  );

  RETURN v_invoice;
END;
$$;

-- ---------------------------------------------------------------------------
-- convert_proforma_to_invoice: copy brand pointer; issue freezes live brand
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.convert_proforma_to_invoice(p_proforma_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_proforma public.proforma_invoices%ROWTYPE;
  v_invoice public.invoices%ROWTYPE;
  v_item record;
  v_existing_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_proforma_id IS NULL THEN
    RAISE EXCEPTION 'Proforma not found';
  END IF;

  SELECT *
  INTO v_proforma
  FROM public.proforma_invoices
  WHERE id = p_proforma_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proforma not found';
  END IF;

  IF NOT public.can_manage_invoices(v_proforma.organization_id) THEN
    RAISE EXCEPTION 'Proforma not found';
  END IF;

  IF v_proforma.converted_invoice_id IS NOT NULL THEN
    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = v_proforma.converted_invoice_id;
    RETURN jsonb_build_object(
      'invoice_id', v_proforma.converted_invoice_id,
      'invoice_number', v_invoice.invoice_number,
      'proforma_id', v_proforma.id,
      'proforma_number', v_proforma.proforma_number,
      'already_converted', true
    );
  END IF;

  IF v_proforma.lifecycle_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled Proforma cannot be converted';
  END IF;

  IF v_proforma.lifecycle_status <> 'draft' THEN
    RAISE EXCEPTION 'Only an active Proforma can be converted';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.proforma_items pi WHERE pi.proforma_id = v_proforma.id
  ) THEN
    RAISE EXCEPTION 'Proforma must have at least one line item';
  END IF;

  SELECT i.id
  INTO v_existing_id
  FROM public.invoices i
  WHERE i.source_proforma_id = v_proforma.id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = v_existing_id;

    PERFORM set_config('app.trusted_proforma_mutation', '1', true);

    UPDATE public.proforma_invoices
    SET
      lifecycle_status = 'converted',
      converted_invoice_id = v_existing_id,
      converted_at = COALESCE(converted_at, now()),
      updated_by = v_actor
    WHERE id = v_proforma.id
    RETURNING * INTO v_proforma;

    RETURN jsonb_build_object(
      'invoice_id', v_existing_id,
      'invoice_number', v_invoice.invoice_number,
      'proforma_id', v_proforma.id,
      'proforma_number', v_proforma.proforma_number,
      'already_converted', true
    );
  END IF;

  PERFORM set_config('app.trusted_proforma_mutation', '1', true);

  INSERT INTO public.invoices (
    organization_id,
    invoice_type,
    document_type,
    recipient_source,
    customer_id,
    booking_id,
    manual_recipient_name,
    manual_recipient_company,
    manual_recipient_phone,
    manual_recipient_email,
    manual_recipient_address,
    manual_recipient_tax_id,
    invoice_number,
    lifecycle_status,
    payment_status,
    currency,
    issue_date,
    due_date,
    subtotal_minor,
    discount_minor,
    tax_minor,
    tax_rate_bps,
    additional_fees_minor,
    total_minor,
    amount_paid_minor,
    balance_due_minor,
    template_key,
    template_version,
    theme_snapshot,
    company_snapshot,
    customer_snapshot,
    booking_snapshot,
    brand_profile_id,
    brand_snapshot,
    notes,
    payment_instructions,
    terms,
    source_proforma_id,
    created_by,
    updated_by
  )
  VALUES (
    v_proforma.organization_id,
    'package',
    'invoice',
    v_proforma.recipient_source,
    CASE
      WHEN v_proforma.recipient_source = 'manual' THEN NULL
      ELSE v_proforma.customer_id
    END,
    CASE
      WHEN v_proforma.recipient_source = 'manual' THEN NULL
      ELSE v_proforma.booking_id
    END,
    v_proforma.manual_recipient_name,
    v_proforma.manual_recipient_company,
    v_proforma.manual_recipient_phone,
    v_proforma.manual_recipient_email,
    v_proforma.manual_recipient_address,
    v_proforma.manual_recipient_tax_id,
    NULL,
    'draft',
    'unpaid',
    v_proforma.currency,
    v_proforma.issue_date,
    v_proforma.due_date,
    v_proforma.subtotal_minor,
    v_proforma.discount_minor,
    v_proforma.tax_minor,
    v_proforma.tax_rate_bps,
    v_proforma.additional_fees_minor,
    v_proforma.total_minor,
    0,
    v_proforma.total_minor,
    'calm-standard',
    2,
    COALESCE(v_proforma.theme_snapshot, '{}'::jsonb),
    COALESCE(v_proforma.company_snapshot, '{}'::jsonb),
    COALESCE(v_proforma.customer_snapshot, '{}'::jsonb),
    CASE
      WHEN v_proforma.recipient_source = 'manual' THEN NULL
      ELSE v_proforma.booking_snapshot
    END,
    v_proforma.brand_profile_id,
    v_proforma.brand_snapshot,
    v_proforma.notes,
    v_proforma.payment_instructions,
    v_proforma.terms,
    v_proforma.id,
    v_actor,
    v_actor
  )
  RETURNING * INTO v_invoice;

  FOR v_item IN
    SELECT *
    FROM public.proforma_items pi
    WHERE pi.proforma_id = v_proforma.id
    ORDER BY pi.sort_order, pi.id
  LOOP
    INSERT INTO public.invoice_items (
      invoice_id,
      description,
      detail,
      quantity,
      unit,
      unit_price_minor,
      discount_minor,
      line_total_minor,
      sort_order
    ) VALUES (
      v_invoice.id,
      v_item.description,
      v_item.detail,
      v_item.quantity,
      v_item.unit,
      v_item.unit_price_minor,
      v_item.discount_minor,
      v_item.line_total_minor,
      v_item.sort_order
    );
  END LOOP;

  v_invoice := public.issue_invoice(v_invoice.id);

  PERFORM set_config('app.trusted_proforma_mutation', '1', true);

  UPDATE public.proforma_invoices
  SET
    lifecycle_status = 'converted',
    converted_invoice_id = v_invoice.id,
    converted_at = now(),
    updated_by = v_actor
  WHERE id = v_proforma.id
  RETURNING * INTO v_proforma;

  PERFORM public.insert_trusted_proforma_event(
    v_proforma.organization_id,
    v_proforma.id,
    'PROFORMA_CONVERTED',
    jsonb_build_object(
      'invoice_id', v_invoice.id,
      'invoice_number', v_invoice.invoice_number
    )
  );

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'INVOICE_CREATED_FROM_PROFORMA',
    jsonb_build_object(
      'proforma_id', v_proforma.id,
      'proforma_number', v_proforma.proforma_number
    )
  );

  RETURN jsonb_build_object(
    'invoice_id', v_invoice.id,
    'invoice_number', v_invoice.invoice_number,
    'proforma_id', v_proforma.id,
    'proforma_number', v_proforma.proforma_number,
    'already_converted', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.convert_proforma_to_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_proforma_to_invoice(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- duplicate_invoice_as_draft: copy brand; new drafts use fixed package layout
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.duplicate_invoice_as_draft(p_source_invoice_id uuid)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_source public.invoices;
  v_new public.invoices;
  v_org_id uuid;
  v_item record;
  v_group record;
  v_new_group_id uuid;
  v_segment record;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_source_invoice_id IS NULL THEN
    RAISE EXCEPTION 'Invoice id is required';
  END IF;

  SELECT *
  INTO v_source
  FROM public.invoices
  WHERE id = p_source_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  v_org_id := v_source.organization_id;

  IF NOT public.can_manage_invoices(v_org_id) THEN
    RAISE EXCEPTION 'Not authorized to duplicate invoices for this organization';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_items ii WHERE ii.invoice_id = v_source.id
  ) THEN
    RAISE EXCEPTION 'Cannot duplicate an invoice without line items';
  END IF;

  IF v_source.invoice_type = 'ticketing' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.invoice_ticket_groups g WHERE g.invoice_id = v_source.id
    ) THEN
      RAISE EXCEPTION 'Cannot duplicate a ticketing invoice without ticket groups';
    END IF;
  END IF;

  INSERT INTO public.invoices (
    organization_id,
    invoice_type,
    document_type,
    recipient_source,
    customer_id,
    booking_id,
    manual_recipient_name,
    manual_recipient_company,
    manual_recipient_phone,
    manual_recipient_email,
    manual_recipient_address,
    manual_recipient_tax_id,
    invoice_number,
    lifecycle_status,
    payment_status,
    currency,
    issue_date,
    due_date,
    subtotal_minor,
    discount_minor,
    tax_minor,
    tax_rate_bps,
    additional_fees_minor,
    total_minor,
    amount_paid_minor,
    balance_due_minor,
    template_key,
    template_version,
    theme_snapshot,
    company_snapshot,
    customer_snapshot,
    booking_snapshot,
    brand_profile_id,
    brand_snapshot,
    notes,
    payment_instructions,
    terms,
    pdf_status,
    pdf_storage_path,
    pdf_generated_at,
    pdf_error_code,
    pdf_generation_token,
    pdf_generation_claimed_at,
    logo_asset_path,
    logo_content_hash,
    issued_at,
    sent_at,
    voided_at,
    void_reason,
    created_by,
    updated_by
  )
  VALUES (
    v_org_id,
    v_source.invoice_type,
    v_source.document_type,
    v_source.recipient_source,
    CASE
      WHEN v_source.recipient_source = 'manual' THEN NULL
      ELSE v_source.customer_id
    END,
    CASE
      WHEN v_source.recipient_source = 'manual' THEN NULL
      ELSE v_source.booking_id
    END,
    v_source.manual_recipient_name,
    v_source.manual_recipient_company,
    v_source.manual_recipient_phone,
    v_source.manual_recipient_email,
    v_source.manual_recipient_address,
    v_source.manual_recipient_tax_id,
    NULL,
    'draft',
    'unpaid',
    v_source.currency,
    NULL,
    NULL,
    v_source.subtotal_minor,
    v_source.discount_minor,
    v_source.tax_minor,
    v_source.tax_rate_bps,
    v_source.additional_fees_minor,
    v_source.total_minor,
    0,
    v_source.total_minor,
    'calm-standard',
    2,
    COALESCE(v_source.theme_snapshot, '{}'::jsonb) || jsonb_build_object(
      'templateKey', 'calm-standard',
      'templateVersion', 2
    ),
    COALESCE(v_source.company_snapshot, '{}'::jsonb),
    COALESCE(v_source.customer_snapshot, '{}'::jsonb),
    CASE
      WHEN v_source.recipient_source = 'manual' THEN NULL
      ELSE v_source.booking_snapshot
    END,
    v_source.brand_profile_id,
    v_source.brand_snapshot,
    v_source.notes,
    v_source.payment_instructions,
    v_source.terms,
    'not_generated',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    v_actor,
    v_actor
  )
  RETURNING * INTO v_new;

  FOR v_item IN
    SELECT *
    FROM public.invoice_items ii
    WHERE ii.invoice_id = v_source.id
    ORDER BY ii.sort_order, ii.id
  LOOP
    INSERT INTO public.invoice_items (
      invoice_id,
      description,
      detail,
      quantity,
      unit,
      unit_price_minor,
      discount_minor,
      line_total_minor,
      sort_order
    )
    VALUES (
      v_new.id,
      v_item.description,
      v_item.detail,
      v_item.quantity,
      v_item.unit,
      v_item.unit_price_minor,
      v_item.discount_minor,
      v_item.line_total_minor,
      v_item.sort_order
    );
  END LOOP;

  IF v_source.invoice_type = 'ticketing' THEN
    FOR v_group IN
      SELECT *
      FROM public.invoice_ticket_groups g
      WHERE g.invoice_id = v_source.id
      ORDER BY g.sort_order, g.id
    LOOP
      INSERT INTO public.invoice_ticket_groups (
        organization_id,
        invoice_id,
        pnr_code,
        passenger_count,
        trip_type,
        primary_airline_code,
        departure_date,
        return_date,
        raw_itinerary,
        sort_order
      )
      VALUES (
        v_org_id,
        v_new.id,
        v_group.pnr_code,
        v_group.passenger_count,
        v_group.trip_type,
        v_group.primary_airline_code,
        v_group.departure_date,
        v_group.return_date,
        v_group.raw_itinerary,
        v_group.sort_order
      )
      RETURNING id INTO v_new_group_id;

      FOR v_segment IN
        SELECT *
        FROM public.invoice_flight_segments s
        WHERE s.ticket_group_id = v_group.id
        ORDER BY s.segment_order, s.id
      LOOP
        INSERT INTO public.invoice_flight_segments (
          organization_id,
          ticket_group_id,
          invoice_id,
          direction,
          segment_order,
          airline_code,
          flight_number,
          booking_class,
          departure_airport,
          arrival_airport,
          departure_local_date,
          departure_local_time,
          arrival_local_date,
          arrival_local_time,
          arrival_day_offset,
          status,
          raw_segment
        )
        VALUES (
          v_org_id,
          v_new_group_id,
          v_new.id,
          v_segment.direction,
          v_segment.segment_order,
          v_segment.airline_code,
          v_segment.flight_number,
          v_segment.booking_class,
          v_segment.departure_airport,
          v_segment.arrival_airport,
          v_segment.departure_local_date,
          v_segment.departure_local_time,
          v_segment.arrival_local_date,
          v_segment.arrival_local_time,
          v_segment.arrival_day_offset,
          v_segment.status,
          v_segment.raw_segment
        );
      END LOOP;
    END LOOP;
  END IF;

  PERFORM public.recalculate_invoice_totals(v_new.id);

  SELECT * INTO v_new FROM public.invoices WHERE id = v_new.id;

  IF v_new.invoice_number IS NOT NULL OR v_new.lifecycle_status <> 'draft' THEN
    RAISE EXCEPTION 'Duplicated draft must remain draft without an invoice number';
  END IF;

  PERFORM public.insert_trusted_invoice_event(
    v_org_id,
    v_new.id,
    'INVOICE_DUPLICATED',
    jsonb_build_object(
      'source_invoice_id', p_source_invoice_id,
      'invoice_type', v_new.invoice_type,
      'document_type', v_new.document_type
    )
  );

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.duplicate_invoice_as_draft(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.duplicate_invoice_as_draft(uuid) TO authenticated;

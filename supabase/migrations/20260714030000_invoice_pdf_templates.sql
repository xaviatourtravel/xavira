-- FIN-001.2: Invoice PDF templates, branding freeze, storage, PDF status
-- Forward-only. Does not modify applied migrations.

-- ---------------------------------------------------------------------------
-- Template key normalization for brand + mutable drafts only
-- Issued/sent/void commercial rows must not be rewritten (immutability trigger).
-- Legacy stored template_key = 'classic' remains and resolves in app/SQL helpers.
-- ---------------------------------------------------------------------------
UPDATE public.invoice_brand_settings
SET default_template_key = 'calm-standard'
WHERE default_template_key IS NULL
   OR default_template_key = ''
   OR default_template_key = 'classic';

UPDATE public.invoices
SET template_key = 'calm-standard'
WHERE lifecycle_status = 'draft'
  AND (
    template_key IS NULL
    OR template_key = ''
    OR template_key = 'classic'
  );

ALTER TABLE public.invoice_brand_settings
  ALTER COLUMN default_template_key SET DEFAULT 'calm-standard';

ALTER TABLE public.invoices
  ALTER COLUMN template_key SET DEFAULT 'calm-standard';

ALTER TABLE public.invoice_brand_settings
  DROP CONSTRAINT IF EXISTS invoice_brand_settings_template_key_check;

ALTER TABLE public.invoice_brand_settings
  ADD CONSTRAINT invoice_brand_settings_template_key_check CHECK (
    default_template_key IN (
      'calm-standard',
      'corporate',
      'travel-banner',
      'editorial-sidebar'
    )
  );

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_template_key_check;

-- Allow legacy `classic` on stored issued rows. New drafts cannot select it
-- via application validation; SQL normalize maps classic → calm-standard.
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_template_key_check CHECK (
    template_key IN (
      'calm-standard',
      'corporate',
      'travel-banner',
      'editorial-sidebar',
      'classic'
    )
  );

-- ---------------------------------------------------------------------------
-- PDF generation status + concurrency claim + immutable logo asset metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS pdf_status text NOT NULL DEFAULT 'not_generated',
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_error_code text,
  ADD COLUMN IF NOT EXISTS pdf_generation_token uuid,
  ADD COLUMN IF NOT EXISTS pdf_generation_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS logo_asset_path text,
  ADD COLUMN IF NOT EXISTS logo_content_hash text;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_pdf_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_pdf_status_check CHECK (
    pdf_status IN ('not_generated', 'generating', 'ready', 'failed')
  );

-- Clients must not directly mutate PDF generation / immutable logo fields.
CREATE OR REPLACE FUNCTION public.prevent_client_invoice_pdf_state_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_trusted text;
BEGIN
  v_trusted := nullif(current_setting('app.trusted_invoice_pdf', true), '');
  IF v_trusted = '1' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.pdf_status IS DISTINCT FROM OLD.pdf_status
      OR NEW.pdf_storage_path IS DISTINCT FROM OLD.pdf_storage_path
      OR NEW.pdf_generated_at IS DISTINCT FROM OLD.pdf_generated_at
      OR NEW.pdf_error_code IS DISTINCT FROM OLD.pdf_error_code
      OR NEW.pdf_generation_token IS DISTINCT FROM OLD.pdf_generation_token
      OR NEW.pdf_generation_claimed_at IS DISTINCT FROM OLD.pdf_generation_claimed_at
      OR NEW.logo_asset_path IS DISTINCT FROM OLD.logo_asset_path
      OR NEW.logo_content_hash IS DISTINCT FROM OLD.logo_content_hash
    THEN
      RAISE EXCEPTION 'PDF state fields are trusted-only';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_prevent_client_pdf_state_edit ON public.invoices;
CREATE TRIGGER invoices_prevent_client_pdf_state_edit
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_invoice_pdf_state_edit();

-- ---------------------------------------------------------------------------
-- Audit events for PDF lifecycle
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_events
  DROP CONSTRAINT IF EXISTS invoice_events_type_check;

ALTER TABLE public.invoice_events
  ADD CONSTRAINT invoice_events_type_check CHECK (
    event_type IN (
      'INVOICE_CREATED',
      'INVOICE_UPDATED',
      'INVOICE_ISSUED',
      'INVOICE_SENT',
      'INVOICE_VOIDED',
      'INVOICE_DUPLICATED',
      'PDF_GENERATION_STARTED',
      'PDF_GENERATED',
      'PDF_GENERATION_FAILED',
      'PDF_DOWNLOADED'
    )
  );

-- Critical PDF events (path/status writes) must use trusted insert.
CREATE OR REPLACE FUNCTION public.guard_invoice_event_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_invoice_org uuid;
  v_trusted text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT i.organization_id
  INTO v_invoice_org
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id;

  IF v_invoice_org IS NULL THEN
    RAISE EXCEPTION 'Invoice not found for event';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM v_invoice_org THEN
    RAISE EXCEPTION 'Event organization must match invoice organization';
  END IF;

  -- Never allow caller-supplied impersonation
  NEW.actor_user_id := auth.uid();

  v_trusted := nullif(current_setting('app.trusted_invoice_event', true), '');

  IF NEW.event_type IN (
    'INVOICE_ISSUED',
    'INVOICE_SENT',
    'INVOICE_VOIDED',
    'INVOICE_DUPLICATED',
    'PDF_GENERATION_STARTED',
    'PDF_GENERATED',
    'PDF_GENERATION_FAILED'
  ) THEN
    IF COALESCE(v_trusted, '') <> '1' THEN
      RAISE EXCEPTION 'Critical invoice events require trusted insert path';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Theme snapshot from draft (freeze per-invoice template/colors)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_invoice_template_key(p_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN lower(trim(COALESCE(p_key, ''))) IN (
      'calm-standard',
      'corporate',
      'travel-banner',
      'editorial-sidebar'
    ) THEN lower(trim(p_key))
    -- Legacy stored value and unknown keys resolve without rewriting rows.
    WHEN lower(trim(COALESCE(p_key, ''))) = 'classic' THEN 'calm-standard'
    ELSE 'calm-standard'
  END;
$$;

CREATE OR REPLACE FUNCTION public.build_invoice_theme_snapshot_from_invoice(
  p_invoice_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_brand public.invoice_brand_settings%ROWTYPE;
  v_template text;
  v_primary text;
  v_secondary text;
  v_accent text;
BEGIN
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  SELECT * INTO v_brand
  FROM public.invoice_brand_settings
  WHERE organization_id = v_invoice.organization_id;

  v_template := public.normalize_invoice_template_key(
    COALESCE(
      v_invoice.template_key,
      v_invoice.theme_snapshot ->> 'templateKey',
      v_brand.default_template_key,
      'calm-standard'
    )
  );

  v_primary := upper(COALESCE(
    nullif(v_invoice.theme_snapshot ->> 'primaryColor', ''),
    v_brand.primary_color,
    '#0F172A'
  ));
  v_secondary := upper(COALESCE(
    nullif(v_invoice.theme_snapshot ->> 'secondaryColor', ''),
    v_brand.secondary_color,
    '#64748B'
  ));
  v_accent := upper(COALESCE(
    nullif(v_invoice.theme_snapshot ->> 'accentColor', ''),
    v_brand.accent_color,
    '#0EA5E9'
  ));

  IF v_primary !~ '^#[0-9A-F]{6}$' THEN
    v_primary := '#0F172A';
  END IF;
  IF v_secondary !~ '^#[0-9A-F]{6}$' THEN
    v_secondary := '#64748B';
  END IF;
  IF v_accent !~ '^#[0-9A-F]{6}$' THEN
    v_accent := '#0EA5E9';
  END IF;

  RETURN jsonb_build_object(
    'templateKey', v_template,
    'templateVersion', COALESCE(v_invoice.template_version, 1),
    'primaryColor', v_primary,
    'secondaryColor', v_secondary,
    'accentColor', v_accent
  );
END;
$$;

REVOKE ALL ON FUNCTION public.build_invoice_theme_snapshot_from_invoice(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.build_invoice_theme_snapshot(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_brand public.invoice_brand_settings%ROWTYPE;
  v_template text;
BEGIN
  SELECT * INTO v_brand
  FROM public.invoice_brand_settings
  WHERE organization_id = p_organization_id;

  v_template := public.normalize_invoice_template_key(
    COALESCE(v_brand.default_template_key, 'calm-standard')
  );

  RETURN jsonb_build_object(
    'templateKey', v_template,
    'templateVersion', 1,
    'primaryColor', upper(COALESCE(v_brand.primary_color, '#0F172A')),
    'secondaryColor', upper(COALESCE(v_brand.secondary_color, '#64748B')),
    'accentColor', upper(COALESCE(v_brand.accent_color, '#0EA5E9'))
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- issue_invoice: freeze draft theme (not live workspace defaults alone)
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

  v_customer := public.build_invoice_customer_snapshot_from_invoice(v_invoice.id);
  v_company := public.build_invoice_company_snapshot(v_org_id);
  v_theme := public.build_invoice_theme_snapshot_from_invoice(v_invoice.id);
  v_template := public.normalize_invoice_template_key(v_theme ->> 'templateKey');
  v_template_version := COALESCE((v_theme ->> 'templateVersion')::integer, 1);
  v_theme := v_theme || jsonb_build_object(
    'templateKey', v_template,
    'templateVersion', v_template_version
  );

  PERFORM public.recalculate_invoice_totals(v_invoice.id);

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;

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
      'template_key', v_template
    )
  );

  RETURN v_invoice;
END;
$$;

-- ---------------------------------------------------------------------------
-- Trusted PDF claim / complete / fail + immutable logo freeze
-- Authenticated clients cannot UPDATE pdf_* / logo_asset_* directly
-- (see prevent_client_invoice_pdf_state_edit). Mutations go through these RPCs.
-- ---------------------------------------------------------------------------

-- Drop non-token predecessors if this unapplied migration was edited before.
DROP FUNCTION IF EXISTS public.record_invoice_pdf_started(uuid);
DROP FUNCTION IF EXISTS public.record_invoice_pdf_generated(uuid, text);
DROP FUNCTION IF EXISTS public.record_invoice_pdf_failed(uuid, text);
DROP FUNCTION IF EXISTS public.record_invoice_pdf_downloaded(uuid);

CREATE OR REPLACE FUNCTION public.claim_invoice_pdf_generation(
  p_invoice_id uuid,
  p_force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices;
  v_token uuid;
  v_stale_after interval := interval '5 minutes';
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.organization_id IS DISTINCT FROM public.get_my_organization_id() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_invoice.lifecycle_status NOT IN ('issued', 'sent') THEN
    RAISE EXCEPTION 'Only issued invoices can generate PDFs';
  END IF;

  IF v_invoice.pdf_status = 'ready'
     AND COALESCE(p_force, false) = false
     AND v_invoice.pdf_storage_path IS NOT NULL THEN
    RETURN jsonb_build_object(
      'outcome', 'already_ready',
      'token', NULL,
      'invoice', to_jsonb(v_invoice)
    );
  END IF;

  IF v_invoice.pdf_status = 'generating'
     AND v_invoice.pdf_generation_claimed_at IS NOT NULL
     AND v_invoice.pdf_generation_claimed_at > (now() - v_stale_after) THEN
    RETURN jsonb_build_object(
      'outcome', 'in_progress',
      'token', NULL,
      'invoice', to_jsonb(v_invoice)
    );
  END IF;

  v_token := gen_random_uuid();

  PERFORM set_config('app.trusted_invoice_pdf', '1', true);

  UPDATE public.invoices
  SET
    pdf_status = 'generating',
    pdf_error_code = NULL,
    pdf_generation_token = v_token,
    pdf_generation_claimed_at = now(),
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'PDF_GENERATION_STARTED',
    jsonb_build_object(
      'template_key', v_invoice.template_key,
      'force', COALESCE(p_force, false),
      'claim_token', v_token
    )
  );

  RETURN jsonb_build_object(
    'outcome', 'claimed',
    'token', v_token,
    'invoice', to_jsonb(v_invoice)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_invoice_pdf_generation(
  p_invoice_id uuid,
  p_token uuid,
  p_storage_path text
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices;
  v_path text := trim(COALESCE(p_storage_path, ''));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_token IS NULL THEN
    RAISE EXCEPTION 'Generation token required';
  END IF;

  IF v_path = '' OR v_path ~ '\.\.|\\\\' OR position('/' in v_path) = 0 THEN
    RAISE EXCEPTION 'Invalid PDF storage path';
  END IF;

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.organization_id IS DISTINCT FROM public.get_my_organization_id() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_invoice.pdf_generation_token IS DISTINCT FROM p_token THEN
    RAISE EXCEPTION 'Stale PDF generation claim';
  END IF;

  IF v_invoice.pdf_status IS DISTINCT FROM 'generating' THEN
    RAISE EXCEPTION 'Invoice is not generating a PDF';
  END IF;

  IF split_part(v_path, '/', 1) <> v_invoice.organization_id::text THEN
    RAISE EXCEPTION 'PDF storage path must be organization-scoped';
  END IF;

  IF split_part(v_path, '/', 2) <> v_invoice.id::text THEN
    RAISE EXCEPTION 'PDF storage path must be invoice-scoped';
  END IF;

  PERFORM set_config('app.trusted_invoice_pdf', '1', true);

  UPDATE public.invoices
  SET
    pdf_storage_path = v_path,
    pdf_status = 'ready',
    pdf_generated_at = now(),
    pdf_error_code = NULL,
    pdf_generation_token = NULL,
    pdf_generation_claimed_at = NULL,
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'PDF_GENERATED',
    jsonb_build_object('storage_path_set', true)
  );

  RETURN v_invoice;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_invoice_pdf_generation(
  p_invoice_id uuid,
  p_token uuid,
  p_error_code text
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices;
  v_code text := left(trim(COALESCE(p_error_code, 'RENDER_FAILED')), 64);
  v_next_status text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_token IS NULL THEN
    RAISE EXCEPTION 'Generation token required';
  END IF;

  -- Never persist stack traces or long free-form text
  IF v_code ~* '(stack|exception|at\s+\w+\.|Error:)' THEN
    v_code := 'RENDER_FAILED';
  END IF;

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.organization_id IS DISTINCT FROM public.get_my_organization_id() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_invoice.pdf_generation_token IS DISTINCT FROM p_token THEN
    RAISE EXCEPTION 'Stale PDF generation claim';
  END IF;

  -- Preserve prior ready PDF path when a replacement attempt fails.
  IF v_invoice.pdf_storage_path IS NOT NULL THEN
    v_next_status := 'ready';
    v_code := NULL;
  ELSE
    v_next_status := 'failed';
  END IF;

  PERFORM set_config('app.trusted_invoice_pdf', '1', true);

  UPDATE public.invoices
  SET
    pdf_status = v_next_status,
    pdf_error_code = v_code,
    pdf_generation_token = NULL,
    pdf_generation_claimed_at = NULL,
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'PDF_GENERATION_FAILED',
    jsonb_build_object(
      'error_code', left(trim(COALESCE(p_error_code, 'RENDER_FAILED')), 64),
      'preserved_ready', v_next_status = 'ready'
    )
  );

  RETURN v_invoice;
END;
$$;

CREATE OR REPLACE FUNCTION public.freeze_invoice_logo_asset(
  p_invoice_id uuid,
  p_asset_path text,
  p_content_hash text
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices;
  v_path text := trim(COALESCE(p_asset_path, ''));
  v_hash text := lower(trim(COALESCE(p_content_hash, '')));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_path = '' OR v_path ~ '\.\.|\\\\' THEN
    RAISE EXCEPTION 'Invalid logo asset path';
  END IF;

  IF v_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid logo content hash';
  END IF;

  IF position(('logo-' || v_hash) in v_path) = 0 THEN
    RAISE EXCEPTION 'Logo path must include content hash';
  END IF;

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.organization_id IS DISTINCT FROM public.get_my_organization_id() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_invoice.lifecycle_status NOT IN ('issued', 'sent') THEN
    RAISE EXCEPTION 'Only issued invoices can freeze logo assets';
  END IF;

  IF split_part(v_path, '/', 1) <> v_invoice.organization_id::text THEN
    RAISE EXCEPTION 'Logo asset path must be organization-scoped';
  END IF;

  IF split_part(v_path, '/', 2) <> v_invoice.id::text THEN
    RAISE EXCEPTION 'Logo asset path must be invoice-scoped';
  END IF;

  -- Immutable once set — older regenerations cannot rewrite logo identity.
  IF v_invoice.logo_asset_path IS NOT NULL THEN
    RETURN v_invoice;
  END IF;

  PERFORM set_config('app.trusted_invoice_pdf', '1', true);

  UPDATE public.invoices
  SET
    logo_asset_path = v_path,
    logo_content_hash = v_hash,
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_invoice_pdf_generation(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_invoice_pdf_generation(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_invoice_pdf_generation(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.freeze_invoice_logo_asset(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_invoice_pdf_generation(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_invoice_pdf_generation(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fail_invoice_pdf_generation(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.freeze_invoice_logo_asset(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Private storage bucket for issued invoice PDFs + immutable logo assets.
-- No storage.objects policies are created for this bucket: authenticated
-- clients cannot SELECT/INSERT/UPDATE/DELETE by guessed path. Only the
-- service role (trusted server) writes/reads objects; the API streams bytes.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-pdfs',
  'invoice-pdfs',
  false,
  20971520,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg'];

-- Ensure no accidental open policies exist for this private bucket.
DROP POLICY IF EXISTS invoice_pdfs_authenticated_select ON storage.objects;
DROP POLICY IF EXISTS invoice_pdfs_authenticated_insert ON storage.objects;
DROP POLICY IF EXISTS invoice_pdfs_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS invoice_pdfs_authenticated_delete ON storage.objects;
DROP POLICY IF EXISTS invoice_pdfs_public_read ON storage.objects;

-- FIN-001.1C: Configurable invoice number prefix
-- Forward-only. Does not modify applied migrations.

-- ---------------------------------------------------------------------------
-- Brand settings: invoice_prefix
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_brand_settings
  ADD COLUMN IF NOT EXISTS invoice_prefix text;

ALTER TABLE public.invoice_brand_settings
  DROP CONSTRAINT IF EXISTS invoice_brand_settings_invoice_prefix_check;

ALTER TABLE public.invoice_brand_settings
  ADD CONSTRAINT invoice_brand_settings_invoice_prefix_check CHECK (
    invoice_prefix IS NULL
    OR (
      length(invoice_prefix) BETWEEN 2 AND 10
      AND invoice_prefix ~ '^[A-Z0-9]+$'
    )
  );

COMMENT ON COLUMN public.invoice_brand_settings.invoice_prefix IS
  'Customer-facing invoice number segment, e.g. XAVIA in INV/XAVIA/2026/0001';

-- ---------------------------------------------------------------------------
-- Deterministic fallback from organization name (never slug / UUID)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.derive_invoice_prefix_from_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_raw text;
  v_tokens text[];
  v_token text;
  v_meaningful text[] := ARRAY[]::text[];
  v_has_legal boolean := false;
  v_legal text[] := ARRAY[
    'PT', 'CV', 'UD', 'FA', 'NV', 'LTD', 'LLC', 'INC', 'CORP', 'CO', 'TBK', 'PERSERO'
  ];
  v_stop text[] := ARRAY[
    'AND', 'DAN', 'OR', 'ATAU', 'OF', 'THE', 'YANG', 'FOR', 'A', 'AN'
  ];
  v_initials text := '';
  v_first text;
BEGIN
  v_raw := upper(trim(COALESCE(p_name, '')));
  v_raw := regexp_replace(v_raw, '[^A-Z0-9]+', ' ', 'g');
  v_raw := trim(regexp_replace(v_raw, '\s+', ' ', 'g'));

  IF v_raw = '' THEN
    RETURN 'ORG';
  END IF;

  v_tokens := string_to_array(v_raw, ' ');

  IF v_tokens[1] = ANY (v_legal) THEN
    v_has_legal := true;
    v_tokens := v_tokens[2:];
  END IF;

  FOREACH v_token IN ARRAY COALESCE(v_tokens, ARRAY[]::text[])
  LOOP
    IF v_token IS NULL OR v_token = '' THEN
      CONTINUE;
    END IF;
    IF v_token = ANY (v_stop) THEN
      CONTINUE;
    END IF;
    v_meaningful := array_append(v_meaningful, v_token);
  END LOOP;

  IF coalesce(array_length(v_meaningful, 1), 0) = 0 THEN
    RETURN 'ORG';
  END IF;

  IF v_has_legal THEN
    IF array_length(v_meaningful, 1) = 1 THEN
      v_first := left(v_meaningful[1], 10);
      IF length(v_first) >= 2 THEN
        RETURN v_first;
      END IF;
      RETURN 'ORG';
    END IF;

    FOREACH v_token IN ARRAY v_meaningful
    LOOP
      v_initials := v_initials || left(v_token, 1);
      EXIT WHEN length(v_initials) >= 10;
    END LOOP;

    IF length(v_initials) >= 2 THEN
      RETURN left(v_initials, 10);
    END IF;
    RETURN 'ORG';
  END IF;

  v_first := left(v_meaningful[1], 10);
  IF length(v_first) >= 2 THEN
    RETURN v_first;
  END IF;

  FOREACH v_token IN ARRAY v_meaningful
  LOOP
    v_initials := v_initials || left(v_token, 1);
    EXIT WHEN length(v_initials) >= 10;
  END LOOP;

  IF length(v_initials) >= 2 THEN
    RETURN left(v_initials, 10);
  END IF;

  RETURN 'ORG';
END;
$$;

REVOKE ALL ON FUNCTION public.derive_invoice_prefix_from_name(text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Resolve prefix: brand setting → org name → ORG
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_invoice_number_code(p_organization_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix text;
  v_name text;
  v_code text;
BEGIN
  SELECT nullif(trim(ibs.invoice_prefix), '')
  INTO v_prefix
  FROM public.invoice_brand_settings ibs
  WHERE ibs.organization_id = p_organization_id;

  IF v_prefix IS NOT NULL AND v_prefix ~ '^[A-Z0-9]{2,10}$' THEN
    RETURN v_prefix;
  END IF;

  SELECT o.name
  INTO v_name
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  v_code := public.derive_invoice_prefix_from_name(v_name);
  IF v_code IS NULL OR length(trim(v_code)) = 0 THEN
    RETURN 'ORG';
  END IF;

  RETURN left(upper(regexp_replace(v_code, '[^A-Z0-9]', '', 'g')), 10);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_invoice_number_code(uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- issue_invoice: use resolve_invoice_number_code (never slug)
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
  v_theme := public.build_invoice_theme_snapshot(v_org_id);

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

  UPDATE public.invoices
  SET
    invoice_number = v_invoice_number,
    lifecycle_status = 'issued',
    issue_date = v_issue_date,
    company_snapshot = v_company,
    customer_snapshot = v_customer,
    booking_snapshot = v_booking,
    theme_snapshot = v_theme,
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
      'number_code', v_number_code
    )
  );

  RETURN v_invoice;
END;
$$;

-- FIN-001.1B: Manual invoice recipient
-- Forward-only. Does not modify 20260714000000.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS recipient_source text NOT NULL DEFAULT 'linked_customer',
  ADD COLUMN IF NOT EXISTS manual_recipient_name text,
  ADD COLUMN IF NOT EXISTS manual_recipient_company text,
  ADD COLUMN IF NOT EXISTS manual_recipient_phone text,
  ADD COLUMN IF NOT EXISTS manual_recipient_email text,
  ADD COLUMN IF NOT EXISTS manual_recipient_address text,
  ADD COLUMN IF NOT EXISTS manual_recipient_tax_id text;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_recipient_source_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_recipient_source_check CHECK (
    recipient_source IN ('linked_customer', 'manual')
  );

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_recipient_shape_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_recipient_shape_check CHECK (
    (
      recipient_source = 'linked_customer'
      AND customer_id IS NOT NULL
      AND (
        manual_recipient_name IS NULL
        OR length(trim(manual_recipient_name)) = 0
      )
    )
    OR (
      recipient_source = 'manual'
      AND customer_id IS NULL
      AND booking_id IS NULL
      AND manual_recipient_name IS NOT NULL
      AND length(trim(manual_recipient_name)) > 0
    )
  );

CREATE INDEX IF NOT EXISTS invoices_organization_manual_name_idx
  ON public.invoices (organization_id, manual_recipient_name)
  WHERE recipient_source = 'manual';

CREATE INDEX IF NOT EXISTS invoices_organization_manual_phone_idx
  ON public.invoices (organization_id, manual_recipient_phone)
  WHERE recipient_source = 'manual' AND manual_recipient_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS invoices_organization_manual_email_idx
  ON public.invoices (organization_id, manual_recipient_email)
  WHERE recipient_source = 'manual' AND manual_recipient_email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Org-ref validation (linked vs manual)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_invoice_org_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.recipient_source = 'manual' THEN
    IF NEW.customer_id IS NOT NULL THEN
      RAISE EXCEPTION 'Manual recipient invoices cannot link a customer';
    END IF;
    IF NEW.booking_id IS NOT NULL THEN
      RAISE EXCEPTION 'Manual recipient invoices cannot attach a booking';
    END IF;
    IF NEW.manual_recipient_name IS NULL
      OR length(trim(NEW.manual_recipient_name)) = 0 THEN
      RAISE EXCEPTION 'Manual recipient name is required';
    END IF;
    RETURN NEW;
  END IF;

  -- linked_customer
  IF NEW.customer_id IS NULL THEN
    RAISE EXCEPTION 'Linked customer invoices require a customer';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = NEW.customer_id
      AND l.organization_id = NEW.organization_id
      AND l.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Customer must belong to the invoice organization';
  END IF;

  IF NEW.booking_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = NEW.booking_id
      AND b.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'Booking must belong to the invoice organization';
  END IF;

  IF NEW.booking_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = NEW.booking_id
      AND b.organization_id = NEW.organization_id
      AND b.lead_id IS NOT NULL
      AND b.lead_id <> NEW.customer_id
  ) THEN
    RAISE EXCEPTION 'Booking customer must match invoice customer';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_validate_org_refs ON public.invoices;
CREATE TRIGGER invoices_validate_org_refs
  BEFORE INSERT OR UPDATE OF
    organization_id,
    customer_id,
    booking_id,
    recipient_source,
    manual_recipient_name
  ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_invoice_org_refs();

-- ---------------------------------------------------------------------------
-- Commercial immutability includes recipient fields
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_issued_invoice_commercial_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.lifecycle_status IN ('issued', 'sent', 'void') THEN
    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id
      OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
      OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
      OR NEW.recipient_source IS DISTINCT FROM OLD.recipient_source
      OR NEW.manual_recipient_name IS DISTINCT FROM OLD.manual_recipient_name
      OR NEW.manual_recipient_company IS DISTINCT FROM OLD.manual_recipient_company
      OR NEW.manual_recipient_phone IS DISTINCT FROM OLD.manual_recipient_phone
      OR NEW.manual_recipient_email IS DISTINCT FROM OLD.manual_recipient_email
      OR NEW.manual_recipient_address IS DISTINCT FROM OLD.manual_recipient_address
      OR NEW.manual_recipient_tax_id IS DISTINCT FROM OLD.manual_recipient_tax_id
      OR NEW.invoice_number IS DISTINCT FROM OLD.invoice_number
      OR NEW.currency IS DISTINCT FROM OLD.currency
      OR NEW.subtotal_minor IS DISTINCT FROM OLD.subtotal_minor
      OR NEW.discount_minor IS DISTINCT FROM OLD.discount_minor
      OR NEW.tax_minor IS DISTINCT FROM OLD.tax_minor
      OR NEW.tax_rate_bps IS DISTINCT FROM OLD.tax_rate_bps
      OR NEW.additional_fees_minor IS DISTINCT FROM OLD.additional_fees_minor
      OR NEW.total_minor IS DISTINCT FROM OLD.total_minor
      OR NEW.theme_snapshot IS DISTINCT FROM OLD.theme_snapshot
      OR NEW.company_snapshot IS DISTINCT FROM OLD.company_snapshot
      OR NEW.customer_snapshot IS DISTINCT FROM OLD.customer_snapshot
      OR NEW.booking_snapshot IS DISTINCT FROM OLD.booking_snapshot
      OR NEW.template_key IS DISTINCT FROM OLD.template_key
      OR NEW.template_version IS DISTINCT FROM OLD.template_version
      OR NEW.notes IS DISTINCT FROM OLD.notes
      OR NEW.payment_instructions IS DISTINCT FROM OLD.payment_instructions
      OR NEW.terms IS DISTINCT FROM OLD.terms
      OR NEW.issue_date IS DISTINCT FROM OLD.issue_date
      OR NEW.issued_at IS DISTINCT FROM OLD.issued_at
    THEN
      RAISE EXCEPTION 'Issued invoices cannot be commercially edited';
    END IF;

    IF NEW.lifecycle_status IS DISTINCT FROM OLD.lifecycle_status THEN
      IF NOT (
        (OLD.lifecycle_status = 'issued' AND NEW.lifecycle_status = 'sent')
        OR (OLD.lifecycle_status IN ('issued', 'sent') AND NEW.lifecycle_status = 'void')
      ) THEN
        RAISE EXCEPTION 'Invalid invoice lifecycle transition';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Customer snapshot: linked from leads, manual from draft columns
-- Signature widened to take the locked invoice row id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.build_invoice_customer_snapshot_from_invoice(
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
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.recipient_source = 'manual' THEN
    RETURN jsonb_build_object(
      'source', 'manual',
      'customer_id', NULL,
      'name', trim(v_invoice.manual_recipient_name),
      'company', nullif(trim(COALESCE(v_invoice.manual_recipient_company, '')), ''),
      'phone', nullif(trim(COALESCE(v_invoice.manual_recipient_phone, '')), ''),
      'email', nullif(trim(COALESCE(v_invoice.manual_recipient_email, '')), ''),
      'address', nullif(trim(COALESCE(v_invoice.manual_recipient_address, '')), ''),
      'tax_id', nullif(trim(COALESCE(v_invoice.manual_recipient_tax_id, '')), '')
    );
  END IF;

  IF v_invoice.customer_id IS NULL THEN
    RAISE EXCEPTION 'Linked customer invoices require a customer';
  END IF;

  SELECT * INTO v_lead
  FROM public.leads
  WHERE id = v_invoice.customer_id
    AND organization_id = v_invoice.organization_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer must belong to the invoice organization';
  END IF;

  RETURN jsonb_build_object(
    'source', 'linked_customer',
    'customer_id', v_lead.id,
    'name', v_lead.full_name,
    'company', NULL,
    'phone', v_lead.phone,
    'email', v_lead.email,
    'address', NULL,
    'tax_id', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.build_invoice_customer_snapshot_from_invoice(uuid) FROM PUBLIC;

-- Keep legacy helper for compatibility (linked only)
CREATE OR REPLACE FUNCTION public.build_invoice_customer_snapshot(
  p_organization_id uuid,
  p_customer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT * INTO v_lead
  FROM public.leads
  WHERE id = p_customer_id
    AND organization_id = p_organization_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer must belong to the invoice organization';
  END IF;

  RETURN jsonb_build_object(
    'source', 'linked_customer',
    'customer_id', v_lead.id,
    'name', v_lead.full_name,
    'company', NULL,
    'phone', v_lead.phone,
    'email', v_lead.email,
    'address', NULL,
    'tax_id', NULL
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- issue_invoice uses recipient-aware customer snapshot
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
  v_slug text;
  v_workspace_code text;
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

  SELECT o.slug INTO v_slug
  FROM public.organizations o
  WHERE o.id = v_org_id;

  v_workspace_code := upper(replace(COALESCE(v_slug, 'WORKSPACE'), '-', ''));
  IF length(v_workspace_code) = 0 THEN
    v_workspace_code := 'WORKSPACE';
  END IF;

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
    v_workspace_code,
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
      'recipient_source', v_invoice.recipient_source
    )
  );

  RETURN v_invoice;
END;
$$;

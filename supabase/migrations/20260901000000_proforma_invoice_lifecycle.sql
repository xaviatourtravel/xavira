-- FIN-005 / FIN-005A / FIN-005B: Proforma Invoice lifecycle (Package-first)
-- Forward-only. Never applied remotely; this file may still be edited.
--
-- FIN-005B snapshot rule:
--   Converted Invoice customer/commercial snapshot = Proforma document snapshot.
--   Issuer company snapshot = live workspace identity at official issue time.
--   issue_invoice live CRM refresh is skipped only when source_proforma_id is set.
--
-- Why a separate table (not invoices.document_type):
--   Existing ticketing `document_type = 'proforma'` still issues official INV/…
--   numbers via issue_invoice. FIN-005 Proforma must never consume that sequence,
--   never appear in AR metrics, and never accept invoice_payments.
--   Conversion creates a new official invoices row and then calls issue_invoice.
--
-- SECURITY DEFINER rationale:
--   convert/cancel/delete allocate sequences and write trusted events.
--   Actor comes from auth.uid(); organization from the locked proforma row.

-- ---------------------------------------------------------------------------
-- Official invoice back-link (nullable; converting Invoice is independent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS source_proforma_id uuid;

COMMENT ON COLUMN public.invoices.source_proforma_id IS
  'FIN-005: official Invoice created from a Proforma. Never stores a PI number.';

CREATE UNIQUE INDEX IF NOT EXISTS invoices_source_proforma_id_unique
  ON public.invoices (source_proforma_id)
  WHERE source_proforma_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Independent PI sequence (never shares invoice_sequences)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proforma_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proforma_sequences_year_positive CHECK (year >= 2000 AND year <= 9999),
  CONSTRAINT proforma_sequences_last_number_non_negative CHECK (last_number >= 0),
  CONSTRAINT proforma_sequences_org_year_unique UNIQUE (organization_id, year)
);

CREATE TRIGGER proforma_sequences_updated_at
  BEFORE UPDATE ON public.proforma_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Proforma documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proforma_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  invoice_type text NOT NULL DEFAULT 'package',
  recipient_source text NOT NULL DEFAULT 'linked_customer',
  customer_id uuid REFERENCES public.leads (id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  manual_recipient_name text,
  manual_recipient_company text,
  manual_recipient_phone text,
  manual_recipient_email text,
  manual_recipient_address text,
  manual_recipient_tax_id text,
  proforma_number text NOT NULL,
  lifecycle_status text NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'IDR',
  issue_date date,
  due_date date,
  subtotal_minor bigint NOT NULL DEFAULT 0,
  discount_minor bigint NOT NULL DEFAULT 0,
  tax_minor bigint NOT NULL DEFAULT 0,
  tax_rate_bps integer NOT NULL DEFAULT 0,
  additional_fees_minor bigint NOT NULL DEFAULT 0,
  total_minor bigint NOT NULL DEFAULT 0,
  template_key text NOT NULL DEFAULT 'calm-standard',
  template_version integer NOT NULL DEFAULT 1,
  theme_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  company_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  booking_snapshot jsonb,
  notes text,
  payment_instructions text,
  terms text,
  converted_invoice_id uuid REFERENCES public.invoices (id) ON DELETE SET NULL,
  converted_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  cancel_reason text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proforma_invoices_invoice_type_check CHECK (invoice_type = 'package'),
  CONSTRAINT proforma_invoices_lifecycle_status_check CHECK (
    lifecycle_status IN ('draft', 'converted', 'cancelled')
  ),
  CONSTRAINT proforma_invoices_recipient_source_check CHECK (
    recipient_source IN ('linked_customer', 'manual')
  ),
  CONSTRAINT proforma_invoices_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT proforma_invoices_proforma_number_format CHECK (
    proforma_number ~ '^PI-[0-9]{4}-[0-9]{6}$'
  ),
  CONSTRAINT proforma_invoices_amounts_non_negative CHECK (
    subtotal_minor >= 0
    AND discount_minor >= 0
    AND tax_minor >= 0
    AND tax_rate_bps >= 0
    AND additional_fees_minor >= 0
    AND total_minor >= 0
  ),
  -- converted_at is the historical marker. converted_invoice_id may become
  -- NULL if the official Invoice is later deleted (ON DELETE SET NULL).
  CONSTRAINT proforma_invoices_converted_integrity CHECK (
    (lifecycle_status = 'draft' AND converted_invoice_id IS NULL AND converted_at IS NULL)
    OR (lifecycle_status = 'cancelled' AND converted_invoice_id IS NULL)
    OR (lifecycle_status = 'converted' AND converted_at IS NOT NULL)
  ),
  CONSTRAINT proforma_invoices_converted_not_cancelled CHECK (
    NOT (lifecycle_status = 'converted' AND cancelled_at IS NOT NULL)
  ),
  CONSTRAINT proforma_invoices_cancelled_requires_reason CHECK (
    lifecycle_status <> 'cancelled'
    OR (cancel_reason IS NOT NULL AND length(trim(cancel_reason)) > 0)
  ),
  CONSTRAINT proforma_invoices_manual_name CHECK (
    recipient_source <> 'manual'
    OR (manual_recipient_name IS NOT NULL AND length(trim(manual_recipient_name)) > 0)
  ),
  CONSTRAINT proforma_invoices_linked_customer CHECK (
    recipient_source <> 'linked_customer'
    OR customer_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS proforma_invoices_org_number_unique
  ON public.proforma_invoices (organization_id, proforma_number);

CREATE UNIQUE INDEX IF NOT EXISTS proforma_invoices_converted_invoice_unique
  ON public.proforma_invoices (converted_invoice_id)
  WHERE converted_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS proforma_invoices_organization_created_idx
  ON public.proforma_invoices (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS proforma_invoices_organization_lifecycle_idx
  ON public.proforma_invoices (organization_id, lifecycle_status);

CREATE INDEX IF NOT EXISTS proforma_invoices_organization_customer_idx
  ON public.proforma_invoices (organization_id, customer_id);

CREATE TRIGGER proforma_invoices_updated_at
  BEFORE UPDATE ON public.proforma_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_source_proforma_id_fkey;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_source_proforma_id_fkey
  FOREIGN KEY (source_proforma_id)
  REFERENCES public.proforma_invoices (id)
  ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.prevent_client_source_proforma_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.source_proforma_id IS NOT NULL THEN
    IF current_setting('app.trusted_proforma_mutation', true) IS DISTINCT FROM '1' THEN
      RAISE EXCEPTION 'source_proforma_id cannot be set directly';
    END IF;
  ELSIF TG_OP = 'UPDATE'
    AND NEW.source_proforma_id IS DISTINCT FROM OLD.source_proforma_id THEN
    IF current_setting('app.trusted_proforma_mutation', true) IS DISTINCT FROM '1' THEN
      RAISE EXCEPTION 'source_proforma_id cannot be set directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_prevent_client_source_proforma_id ON public.invoices;
CREATE TRIGGER invoices_prevent_client_source_proforma_id
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_source_proforma_id();

-- ---------------------------------------------------------------------------
-- Line items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proforma_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_id uuid NOT NULL REFERENCES public.proforma_invoices (id) ON DELETE CASCADE,
  description text NOT NULL,
  detail text,
  quantity numeric(12, 4) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'unit',
  unit_price_minor bigint NOT NULL DEFAULT 0,
  discount_minor bigint NOT NULL DEFAULT 0,
  line_total_minor bigint NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proforma_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT proforma_items_amounts_non_negative CHECK (
    unit_price_minor >= 0
    AND discount_minor >= 0
    AND line_total_minor >= 0
  )
);

CREATE INDEX IF NOT EXISTS proforma_items_proforma_sort_idx
  ON public.proforma_items (proforma_id, sort_order);

CREATE TRIGGER proforma_items_updated_at
  BEFORE UPDATE ON public.proforma_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Events (separate from invoice_events so Proforma is not an Invoice)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proforma_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  proforma_id uuid NOT NULL REFERENCES public.proforma_invoices (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proforma_events_type_check CHECK (
    event_type IN (
      'PROFORMA_CREATED',
      'PROFORMA_UPDATED',
      'PROFORMA_CANCELLED',
      'PROFORMA_CONVERTED',
      'PROFORMA_DELETED'
    )
  )
);

CREATE INDEX IF NOT EXISTS proforma_events_proforma_created_idx
  ON public.proforma_events (proforma_id, created_at DESC);

CREATE INDEX IF NOT EXISTS proforma_events_organization_created_idx
  ON public.proforma_events (organization_id, created_at DESC);

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
      'INVOICE_ARCHIVED',
      'INVOICE_RESTORED',
      'INVOICE_DELETED',
      'PDF_GENERATION_STARTED',
      'PDF_GENERATED',
      'PDF_GENERATION_FAILED',
      'PDF_DOWNLOADED',
      'INVOICE_PAYMENT_RECORDED',
      'INVOICE_PAYMENT_UPDATED',
      'INVOICE_CREATED_FROM_PROFORMA'
    )
  );

-- ---------------------------------------------------------------------------
-- Allocate PI-YYYY-000001 from proforma_sequences only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_proforma_number(p_organization_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_year integer;
  v_next integer;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization is required';
  END IF;

  v_year := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Asia/Jakarta'))::integer;

  INSERT INTO public.proforma_sequences (organization_id, year, last_number)
  VALUES (p_organization_id, v_year, 0)
  ON CONFLICT (organization_id, year) DO NOTHING;

  SELECT s.last_number + 1
  INTO v_next
  FROM public.proforma_sequences s
  WHERE s.organization_id = p_organization_id
    AND s.year = v_year
  FOR UPDATE;

  UPDATE public.proforma_sequences
  SET last_number = v_next
  WHERE organization_id = p_organization_id
    AND year = v_year;

  RETURN format('PI-%s-%s', v_year::text, lpad(v_next::text, 6, '0'));
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_proforma_number(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.assign_proforma_number_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Never trust client-supplied PI numbers.
  NEW.proforma_number := public.allocate_proforma_number(NEW.organization_id);
  NEW.lifecycle_status := 'draft';
  NEW.converted_invoice_id := NULL;
  NEW.converted_at := NULL;
  NEW.cancelled_at := NULL;
  NEW.cancelled_by := NULL;
  NEW.cancel_reason := NULL;
  NEW.invoice_type := 'package';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proforma_invoices_assign_number ON public.proforma_invoices;
CREATE TRIGGER proforma_invoices_assign_number
  BEFORE INSERT ON public.proforma_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_proforma_number_on_insert();

-- ---------------------------------------------------------------------------
-- Org refs + immutability
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_proforma_org_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.recipient_source = 'linked_customer' THEN
    IF NEW.customer_id IS NULL THEN
      RAISE EXCEPTION 'Linked customer proforma requires a customer';
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = NEW.customer_id
        AND l.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Customer does not belong to this organization';
    END IF;
    IF NEW.booking_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = NEW.booking_id
        AND b.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Booking does not belong to this organization';
    END IF;
  ELSE
    NEW.customer_id := NULL;
    NEW.booking_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proforma_invoices_validate_org_refs ON public.proforma_invoices;
CREATE TRIGGER proforma_invoices_validate_org_refs
  BEFORE INSERT OR UPDATE ON public.proforma_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_proforma_org_refs();

CREATE OR REPLACE FUNCTION public.prevent_locked_proforma_commercial_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.lifecycle_status IN ('converted', 'cancelled') THEN
    IF current_setting('app.trusted_proforma_mutation', true) = '1' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Converted or cancelled Proforma cannot be edited';
  END IF;

  IF current_setting('app.trusted_proforma_mutation', true) IS DISTINCT FROM '1' THEN
    IF NEW.lifecycle_status IS DISTINCT FROM OLD.lifecycle_status THEN
      RAISE EXCEPTION 'Proforma status cannot be changed directly';
    END IF;
    IF NEW.converted_invoice_id IS DISTINCT FROM OLD.converted_invoice_id
      OR NEW.converted_at IS DISTINCT FROM OLD.converted_at
      OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
      OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
      OR NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason
    THEN
      RAISE EXCEPTION 'Proforma conversion and cancel fields cannot be changed directly';
    END IF;
  END IF;

  IF NEW.proforma_number IS DISTINCT FROM OLD.proforma_number THEN
    RAISE EXCEPTION 'Proforma number cannot be changed';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'Proforma organization cannot be changed';
  END IF;

  IF NEW.invoice_type IS DISTINCT FROM OLD.invoice_type THEN
    RAISE EXCEPTION 'Proforma type cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proforma_invoices_prevent_locked_edit ON public.proforma_invoices;
CREATE TRIGGER proforma_invoices_prevent_locked_edit
  BEFORE UPDATE ON public.proforma_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_proforma_commercial_edit();

CREATE OR REPLACE FUNCTION public.prevent_locked_proforma_item_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_id uuid;
BEGIN
  v_id := COALESCE(NEW.proforma_id, OLD.proforma_id);
  SELECT lifecycle_status INTO v_status
  FROM public.proforma_invoices
  WHERE id = v_id;

  IF v_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Converted or cancelled Proforma cannot be edited';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS proforma_items_prevent_locked_edit ON public.proforma_items;
CREATE TRIGGER proforma_items_prevent_locked_edit
  BEFORE INSERT OR UPDATE OR DELETE ON public.proforma_items
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_proforma_item_edit();

CREATE OR REPLACE FUNCTION public.insert_trusted_proforma_event(
  p_organization_id uuid,
  p_proforma_id uuid,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM set_config('app.trusted_proforma_event', '1', true);

  INSERT INTO public.proforma_events (
    organization_id,
    proforma_id,
    event_type,
    actor_user_id,
    metadata
  ) VALUES (
    p_organization_id,
    p_proforma_id,
    p_event_type,
    auth.uid(),
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.insert_trusted_proforma_event(uuid, uuid, text, jsonb) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- FIN-005B: Proforma customer/booking snapshots for official issue
-- Never reads live CRM. Never trusts invoice.customer_snapshot JSON.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.proforma_document_snapshots_for_issue(p_invoice_id uuid)
RETURNS TABLE(customer_snapshot jsonb, booking_snapshot jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_proforma public.proforma_invoices%ROWTYPE;
  v_name text;
  v_customer jsonb;
BEGIN
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND OR v_invoice.source_proforma_id IS NULL THEN
    RAISE EXCEPTION 'Invoice is not sourced from a Proforma';
  END IF;

  SELECT * INTO v_proforma
  FROM public.proforma_invoices
  WHERE id = v_invoice.source_proforma_id
    AND organization_id = v_invoice.organization_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proforma source does not belong to this invoice';
  END IF;

  IF v_proforma.lifecycle_status <> 'draft' THEN
    RAISE EXCEPTION 'Proforma source must be an active Proforma';
  END IF;

  IF v_proforma.recipient_source IS DISTINCT FROM v_invoice.recipient_source THEN
    RAISE EXCEPTION 'Proforma recipient source does not match invoice';
  END IF;

  v_customer := COALESCE(v_proforma.customer_snapshot, '{}'::jsonb);
  v_name := nullif(trim(COALESCE(v_customer ->> 'name', '')), '');
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Proforma customer snapshot is missing';
  END IF;

  IF v_invoice.recipient_source = 'linked_customer' AND v_invoice.customer_id IS NOT NULL THEN
    v_customer := jsonb_set(
      v_customer,
      '{customer_id}',
      to_jsonb(v_invoice.customer_id::text),
      true
    );
  END IF;

  customer_snapshot := v_customer;
  IF v_invoice.recipient_source = 'manual' THEN
    booking_snapshot := NULL;
  ELSE
    booking_snapshot := v_proforma.booking_snapshot;
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.proforma_document_snapshots_for_issue(uuid) FROM PUBLIC;

-- FIN-005B overlay on the current issue_invoice (ticketing-hardened body).
-- Default path still rebuilds customer/booking from live CRM and company from
-- live workspace. Proforma-sourced invoices replace only customer/booking.
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
  v_company := public.build_invoice_company_snapshot(v_org_id);
  v_theme := public.build_invoice_theme_snapshot_from_invoice(v_invoice.id);
  v_template := public.normalize_invoice_template_key(v_theme ->> 'templateKey');
  v_template_version := COALESCE((v_theme ->> 'templateVersion')::integer, 1);
  v_theme := v_theme || jsonb_build_object(
    'templateKey', v_template,
    'templateVersion', v_template_version
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
      'template_key', v_template,
      'invoice_type', v_invoice.invoice_type,
      'document_type', v_invoice.document_type
    )
  );

  RETURN v_invoice;
END;
$$;

-- ---------------------------------------------------------------------------
-- Convert Proforma → official Invoice (atomic, one Invoice max)
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

  -- Idempotency first: never error on a Proforma that already has an Invoice.
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
    v_proforma.template_key,
    COALESCE(v_proforma.template_version, 1),
    COALESCE(v_proforma.theme_snapshot, '{}'::jsonb),
    COALESCE(v_proforma.company_snapshot, '{}'::jsonb),
    COALESCE(v_proforma.customer_snapshot, '{}'::jsonb),
    CASE
      WHEN v_proforma.recipient_source = 'manual' THEN NULL
      ELSE v_proforma.booking_snapshot
    END,
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

  -- Official INV/… number is allocated only here, via existing issue_invoice.
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
-- Cancel active Proforma (no INV number, history preserved)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_proforma(p_proforma_id uuid, p_reason text)
RETURNS public.proforma_invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_proforma public.proforma_invoices%ROWTYPE;
  v_reason text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_reason := nullif(trim(p_reason), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Cancel reason is required';
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

  IF v_proforma.lifecycle_status = 'converted' THEN
    RAISE EXCEPTION 'Converted Proforma cannot be cancelled';
  END IF;

  IF v_proforma.lifecycle_status = 'cancelled' THEN
    RETURN v_proforma;
  END IF;

  PERFORM set_config('app.trusted_proforma_mutation', '1', true);

  UPDATE public.proforma_invoices
  SET
    lifecycle_status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = v_actor,
    cancel_reason = v_reason,
    updated_by = v_actor
  WHERE id = v_proforma.id
  RETURNING * INTO v_proforma;

  PERFORM public.insert_trusted_proforma_event(
    v_proforma.organization_id,
    v_proforma.id,
    'PROFORMA_CANCELLED',
    jsonb_build_object('reason', v_reason)
  );

  RETURN v_proforma;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_proforma(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_proforma(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Hard-delete active (unconverted) Proforma only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_draft_proforma(p_proforma_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_proforma public.proforma_invoices%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
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

  IF v_proforma.lifecycle_status <> 'draft' OR v_proforma.converted_invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Only an active unconverted Proforma can be deleted';
  END IF;

  DELETE FROM public.proforma_invoices WHERE id = v_proforma.id;

  RETURN jsonb_build_object(
    'proforma_id', v_proforma.id,
    'proforma_number', v_proforma.proforma_number,
    'organization_id', v_proforma.organization_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_draft_proforma(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_draft_proforma(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.proforma_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS proforma_sequences_select_manager ON public.proforma_sequences;
CREATE POLICY proforma_sequences_select_manager
  ON public.proforma_sequences
  FOR SELECT
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

DROP POLICY IF EXISTS proforma_invoices_select_member ON public.proforma_invoices;
CREATE POLICY proforma_invoices_select_member
  ON public.proforma_invoices
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

DROP POLICY IF EXISTS proforma_invoices_insert_manager ON public.proforma_invoices;
CREATE POLICY proforma_invoices_insert_manager
  ON public.proforma_invoices
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND lifecycle_status = 'draft'
  );

DROP POLICY IF EXISTS proforma_invoices_update_manager ON public.proforma_invoices;
CREATE POLICY proforma_invoices_update_manager
  ON public.proforma_invoices
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND lifecycle_status = 'draft'
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND lifecycle_status = 'draft'
    AND converted_invoice_id IS NULL
  );

DROP POLICY IF EXISTS proforma_invoices_delete_manager_draft ON public.proforma_invoices;
CREATE POLICY proforma_invoices_delete_manager_draft
  ON public.proforma_invoices
  FOR DELETE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND lifecycle_status = 'draft'
    AND converted_invoice_id IS NULL
  );

DROP POLICY IF EXISTS proforma_items_select_member ON public.proforma_items;
CREATE POLICY proforma_items_select_member
  ON public.proforma_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.proforma_invoices p
      WHERE p.id = proforma_id
        AND p.organization_id = public.get_my_organization_id()
    )
  );

DROP POLICY IF EXISTS proforma_items_insert_manager ON public.proforma_items;
CREATE POLICY proforma_items_insert_manager
  ON public.proforma_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.proforma_invoices p
      WHERE p.id = proforma_id
        AND p.organization_id = public.get_my_organization_id()
        AND public.can_manage_invoices(p.organization_id)
        AND p.lifecycle_status = 'draft'
    )
  );

DROP POLICY IF EXISTS proforma_items_update_manager ON public.proforma_items;
CREATE POLICY proforma_items_update_manager
  ON public.proforma_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.proforma_invoices p
      WHERE p.id = proforma_id
        AND p.organization_id = public.get_my_organization_id()
        AND public.can_manage_invoices(p.organization_id)
        AND p.lifecycle_status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.proforma_invoices p
      WHERE p.id = proforma_id
        AND p.organization_id = public.get_my_organization_id()
        AND public.can_manage_invoices(p.organization_id)
        AND p.lifecycle_status = 'draft'
    )
  );

DROP POLICY IF EXISTS proforma_items_delete_manager ON public.proforma_items;
CREATE POLICY proforma_items_delete_manager
  ON public.proforma_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.proforma_invoices p
      WHERE p.id = proforma_id
        AND p.organization_id = public.get_my_organization_id()
        AND public.can_manage_invoices(p.organization_id)
        AND p.lifecycle_status = 'draft'
    )
  );

DROP POLICY IF EXISTS proforma_events_select_member ON public.proforma_events;
CREATE POLICY proforma_events_select_member
  ON public.proforma_events
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

DROP POLICY IF EXISTS proforma_events_insert_noncritical ON public.proforma_events;
CREATE POLICY proforma_events_insert_noncritical
  ON public.proforma_events
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND event_type IN ('PROFORMA_CREATED', 'PROFORMA_UPDATED')
  );

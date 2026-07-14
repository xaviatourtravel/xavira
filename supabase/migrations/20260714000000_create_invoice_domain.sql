-- FIN-001.1 / FIN-001.1A: Customer invoice domain foundation (hardened)
-- Forward-only. Uncommitted; editable before any push.
--
-- SECURITY DEFINER rationale:
--   issue/void/sent allocate sequences and write trusted audit events that
--   bypass normal INSERT RLS on invoice_events. They always derive actor from
--   auth.uid() and organization from the locked invoice row — never from
--   caller-supplied identity or snapshot payloads.

-- ---------------------------------------------------------------------------
-- Brand settings (workspace defaults)
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  default_template_key text NOT NULL DEFAULT 'classic',
  primary_color text NOT NULL DEFAULT '#0F172A',
  secondary_color text NOT NULL DEFAULT '#64748B',
  accent_color text NOT NULL DEFAULT '#0EA5E9',
  logo_url text,
  legal_name text,
  address text,
  email text,
  phone text,
  website text,
  tax_id text,
  footer_text text,
  payment_accounts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER invoice_brand_settings_updated_at
  BEFORE UPDATE ON public.invoice_brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Per-organization yearly sequences
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  year integer NOT NULL,
  prefix text NOT NULL DEFAULT 'INV',
  last_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_sequences_year_positive CHECK (year >= 2000 AND year <= 9999),
  CONSTRAINT invoice_sequences_last_number_non_negative CHECK (last_number >= 0),
  CONSTRAINT invoice_sequences_org_year_unique UNIQUE (organization_id, year)
);

CREATE TRIGGER invoice_sequences_updated_at
  BEFORE UPDATE ON public.invoice_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Invoices
-- payment_status persists BASE state only (unpaid/partially_paid/paid).
-- Overdue is derived on read from due_date + balance + lifecycle.
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  invoice_number text,
  lifecycle_status text NOT NULL DEFAULT 'draft',
  payment_status text NOT NULL DEFAULT 'unpaid',
  currency text NOT NULL DEFAULT 'IDR',
  issue_date date,
  due_date date,
  subtotal_minor bigint NOT NULL DEFAULT 0,
  discount_minor bigint NOT NULL DEFAULT 0,
  tax_minor bigint NOT NULL DEFAULT 0,
  tax_rate_bps integer NOT NULL DEFAULT 0,
  additional_fees_minor bigint NOT NULL DEFAULT 0,
  total_minor bigint NOT NULL DEFAULT 0,
  amount_paid_minor bigint NOT NULL DEFAULT 0,
  balance_due_minor bigint NOT NULL DEFAULT 0,
  template_key text NOT NULL DEFAULT 'classic',
  template_version integer NOT NULL DEFAULT 1,
  theme_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  company_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  booking_snapshot jsonb,
  notes text,
  payment_instructions text,
  terms text,
  pdf_storage_path text,
  issued_at timestamptz,
  sent_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_lifecycle_status_check CHECK (
    lifecycle_status IN ('draft', 'issued', 'sent', 'void')
  ),
  CONSTRAINT invoices_payment_status_check CHECK (
    payment_status IN ('unpaid', 'partially_paid', 'paid')
  ),
  CONSTRAINT invoices_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT invoices_amounts_non_negative CHECK (
    subtotal_minor >= 0
    AND discount_minor >= 0
    AND tax_minor >= 0
    AND tax_rate_bps >= 0
    AND additional_fees_minor >= 0
    AND total_minor >= 0
    AND amount_paid_minor >= 0
    AND balance_due_minor >= 0
  ),
  CONSTRAINT invoices_amount_paid_not_over_total CHECK (amount_paid_minor <= total_minor),
  CONSTRAINT invoices_draft_has_no_number CHECK (
    lifecycle_status <> 'draft' OR invoice_number IS NULL
  ),
  CONSTRAINT invoices_issued_has_number CHECK (
    lifecycle_status IN ('draft', 'void') OR invoice_number IS NOT NULL
  ),
  CONSTRAINT invoices_void_requires_reason CHECK (
    lifecycle_status <> 'void'
    OR (void_reason IS NOT NULL AND length(trim(void_reason)) > 0)
  )
);

CREATE UNIQUE INDEX invoices_organization_invoice_number_unique
  ON public.invoices (organization_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE INDEX invoices_organization_created_idx
  ON public.invoices (organization_id, created_at DESC);

CREATE INDEX invoices_organization_lifecycle_idx
  ON public.invoices (organization_id, lifecycle_status);

CREATE INDEX invoices_organization_payment_idx
  ON public.invoices (organization_id, payment_status);

CREATE INDEX invoices_organization_customer_idx
  ON public.invoices (organization_id, customer_id);

CREATE INDEX invoices_organization_booking_idx
  ON public.invoices (organization_id, booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX invoices_organization_due_date_idx
  ON public.invoices (organization_id, due_date);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Line items
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
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
  CONSTRAINT invoice_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT invoice_items_amounts_non_negative CHECK (
    unit_price_minor >= 0
    AND discount_minor >= 0
    AND line_total_minor >= 0
  )
);

CREATE INDEX invoice_items_invoice_sort_idx
  ON public.invoice_items (invoice_id, sort_order);

CREATE TRIGGER invoice_items_updated_at
  BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_events_type_check CHECK (
    event_type IN (
      'INVOICE_CREATED',
      'INVOICE_UPDATED',
      'INVOICE_ISSUED',
      'INVOICE_SENT',
      'INVOICE_VOIDED',
      'INVOICE_DUPLICATED'
    )
  )
);

CREATE INDEX invoice_events_invoice_created_idx
  ON public.invoice_events (invoice_id, created_at DESC);

CREATE INDEX invoice_events_organization_created_idx
  ON public.invoice_events (organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Organization-aware membership + invoice permission
-- Authoritative membership model: profiles.organization_id == active org
-- (no separate membership table exists in this product).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_invoices(p_organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile_org uuid;
  v_role text;
BEGIN
  IF v_uid IS NULL OR p_organization_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT p.organization_id, p.role::text
  INTO v_profile_org, v_role
  FROM public.profiles p
  WHERE p.id = v_uid;

  IF v_profile_org IS NULL OR v_profile_org IS DISTINCT FROM p_organization_id THEN
    RETURN false;
  END IF;

  RETURN v_role IN ('owner', 'admin', 'finance');
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_invoices(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_invoices(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Cross-organization reference protection
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_invoice_org_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
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

CREATE TRIGGER invoices_validate_org_refs
  BEFORE INSERT OR UPDATE OF organization_id, customer_id, booking_id
  ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_invoice_org_refs();

-- Issued commercial immutability (only trusted lifecycle / payment / pdf fields may change)
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

    -- Restrict lifecycle transitions
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

CREATE TRIGGER invoices_prevent_commercial_edit
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_issued_invoice_commercial_edit();

CREATE OR REPLACE FUNCTION public.prevent_issued_invoice_item_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  invoice_lifecycle text;
BEGIN
  SELECT i.lifecycle_status
  INTO invoice_lifecycle
  FROM public.invoices i
  WHERE i.id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  IF invoice_lifecycle IN ('issued', 'sent', 'void') THEN
    RAISE EXCEPTION 'Issued invoice items cannot be edited';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_items_prevent_issued_edit
  BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_issued_invoice_item_edit();

-- ---------------------------------------------------------------------------
-- Trusted audit event gate
-- Critical events require app.trusted_invoice_event = '1' (set only inside
-- SECURITY DEFINER transition functions). Actor is always auth.uid().
-- ---------------------------------------------------------------------------
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
    'INVOICE_DUPLICATED'
  ) THEN
    IF v_trusted IS DISTINCT FROM '1' THEN
      RAISE EXCEPTION 'Critical invoice events can only be written by trusted functions';
    END IF;
  ELSIF NEW.event_type IN ('INVOICE_CREATED', 'INVOICE_UPDATED') THEN
    IF NEW.organization_id IS DISTINCT FROM public.get_my_organization_id() THEN
      RAISE EXCEPTION 'Event organization mismatch';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown invoice event type';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_events_guard_insert
  BEFORE INSERT ON public.invoice_events
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_invoice_event_insert();

CREATE OR REPLACE FUNCTION public.insert_trusted_invoice_event(
  p_organization_id uuid,
  p_invoice_id uuid,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Internal helper: only call from other SECURITY DEFINER invoice RPCs.
  PERFORM set_config('app.trusted_invoice_event', '1', true);

  INSERT INTO public.invoice_events (
    organization_id,
    invoice_id,
    event_type,
    actor_user_id,
    metadata
  ) VALUES (
    p_organization_id,
    p_invoice_id,
    p_event_type,
    auth.uid(),
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.insert_trusted_invoice_event(uuid, uuid, text, jsonb) FROM PUBLIC;
-- Not granted to authenticated — only invokable by other SECURITY DEFINER functions
-- in the same schema owner context.

-- ---------------------------------------------------------------------------
-- Recalculate totals from persisted items (server-authoritative)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item record;
  v_gross bigint;
  v_line_total bigint;
  v_subtotal bigint := 0;
  v_discount bigint;
  v_tax_rate integer;
  v_tax bigint;
  v_fees bigint;
  v_amount_paid bigint;
  v_total bigint;
  v_balance bigint;
  v_payment_status text;
  v_item_count integer := 0;
BEGIN
  SELECT discount_minor, tax_rate_bps, tax_minor, additional_fees_minor, amount_paid_minor
  INTO v_discount, v_tax_rate, v_tax, v_fees, v_amount_paid
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_discount < 0 OR v_tax_rate < 0 OR v_tax < 0 OR v_fees < 0 OR v_amount_paid < 0 THEN
    RAISE EXCEPTION 'Negative monetary values are not allowed';
  END IF;

  FOR v_item IN
    SELECT id, quantity, unit_price_minor, discount_minor
    FROM public.invoice_items
    WHERE invoice_id = p_invoice_id
    ORDER BY sort_order, created_at
    FOR UPDATE
  LOOP
    v_item_count := v_item_count + 1;

    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'quantity must be positive';
    END IF;
    IF v_item.unit_price_minor < 0 OR v_item.discount_minor < 0 THEN
      RAISE EXCEPTION 'Negative monetary values are not allowed';
    END IF;

    v_gross := round(v_item.quantity * v_item.unit_price_minor)::bigint;
    IF v_item.discount_minor > v_gross THEN
      RAISE EXCEPTION 'line discount cannot exceed line gross';
    END IF;

    v_line_total := v_gross - v_item.discount_minor;
    v_subtotal := v_subtotal + v_line_total;

    UPDATE public.invoice_items
    SET line_total_minor = v_line_total
    WHERE id = v_item.id;
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Invoice must have at least one line item';
  END IF;

  IF v_discount > v_subtotal THEN
    RAISE EXCEPTION 'invoice discount cannot exceed subtotal';
  END IF;

  -- Prefer stored tax_minor when tax_rate_bps = 0 and tax already set,
  -- otherwise compute from rate. When rate > 0, recompute from rate.
  IF v_tax_rate > 0 THEN
    v_tax := round(((v_subtotal - v_discount)::numeric * v_tax_rate) / 10000.0)::bigint;
  ELSIF v_tax < 0 THEN
    RAISE EXCEPTION 'tax cannot be negative';
  END IF;

  v_total := (v_subtotal - v_discount) + v_tax + v_fees;

  IF v_amount_paid > v_total THEN
    RAISE EXCEPTION 'overpayment is not allowed';
  END IF;

  v_balance := v_total - v_amount_paid;

  IF v_total = 0 AND v_amount_paid = 0 THEN
    v_payment_status := 'paid';
  ELSIF v_amount_paid = 0 THEN
    v_payment_status := 'unpaid';
  ELSIF v_balance = 0 THEN
    v_payment_status := 'paid';
  ELSE
    v_payment_status := 'partially_paid';
  END IF;

  UPDATE public.invoices
  SET
    subtotal_minor = v_subtotal,
    discount_minor = v_discount,
    tax_minor = v_tax,
    additional_fees_minor = v_fees,
    total_minor = v_total,
    amount_paid_minor = v_amount_paid,
    balance_due_minor = v_balance,
    payment_status = v_payment_status
  WHERE id = p_invoice_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_invoice_totals(uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Build authoritative snapshots from tables (never from caller JSON)
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
BEGIN
  SELECT * INTO v_org FROM public.organizations WHERE id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  SELECT * INTO v_brand
  FROM public.invoice_brand_settings
  WHERE organization_id = p_organization_id;

  v_settings := COALESCE(v_org.settings, '{}'::jsonb);

  RETURN jsonb_build_object(
    'legalName', COALESCE(v_brand.legal_name, v_org.name),
    'logoUrl', COALESCE(v_brand.logo_url, v_settings ->> 'logoUrl'),
    'address', v_brand.address,
    'email', COALESCE(v_brand.email, v_settings ->> 'businessEmail'),
    'phone', COALESCE(v_brand.phone, v_org.phone),
    'website', COALESCE(v_brand.website, v_settings ->> 'website'),
    'taxId', v_brand.tax_id,
    'paymentAccounts', COALESCE(v_brand.payment_accounts_json, '[]'::jsonb),
    'primaryColor', COALESCE(v_brand.primary_color, '#0F172A'),
    'secondaryColor', COALESCE(v_brand.secondary_color, '#64748B'),
    'accentColor', COALESCE(v_brand.accent_color, '#0EA5E9'),
    'footerText', v_brand.footer_text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.build_invoice_company_snapshot(uuid) FROM PUBLIC;

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
    'name', v_lead.full_name,
    'company', NULL,
    'phone', v_lead.phone,
    'email', v_lead.email,
    'address', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.build_invoice_customer_snapshot(uuid, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.build_invoice_booking_snapshot(
  p_organization_id uuid,
  p_booking_id uuid,
  p_customer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  IF p_booking_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking must belong to the invoice organization';
  END IF;

  IF v_booking.lead_id IS NOT NULL AND v_booking.lead_id <> p_customer_id THEN
    RAISE EXCEPTION 'Booking customer must match invoice customer';
  END IF;

  RETURN jsonb_build_object(
    'bookingId', v_booking.id,
    'bookingCode', v_booking.booking_code,
    'packageName', v_booking.package_name,
    'departureDate', v_booking.departure_date,
    'participantCount', v_booking.total_pax,
    'leadTraveller', v_booking.customer_name,
    'totalAmountMinor', CASE
      WHEN v_booking.total_amount IS NULL THEN NULL
      ELSE round(v_booking.total_amount)::bigint
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.build_invoice_booking_snapshot(uuid, uuid, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.build_invoice_theme_snapshot(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_brand public.invoice_brand_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_brand
  FROM public.invoice_brand_settings
  WHERE organization_id = p_organization_id;

  RETURN jsonb_build_object(
    'templateKey', COALESCE(v_brand.default_template_key, 'classic'),
    'templateVersion', 1,
    'primaryColor', COALESCE(v_brand.primary_color, '#0F172A'),
    'secondaryColor', COALESCE(v_brand.secondary_color, '#64748B'),
    'accentColor', COALESCE(v_brand.accent_color, '#0EA5E9')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.build_invoice_theme_snapshot(uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Atomic issue — signature: issue_invoice(p_invoice_id uuid) ONLY
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

  -- Cross-org refs already enforced by trigger; re-verify before snapshot
  v_customer := public.build_invoice_customer_snapshot(v_org_id, v_invoice.customer_id);
  v_booking := public.build_invoice_booking_snapshot(
    v_org_id,
    v_invoice.booking_id,
    v_invoice.customer_id
  );
  v_company := public.build_invoice_company_snapshot(v_org_id);
  v_theme := public.build_invoice_theme_snapshot(v_org_id);

  -- Recalculate totals from persisted items (rejects empty / negative / overpay)
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
      'total_minor', v_invoice.total_minor
    )
  );

  RETURN v_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_invoice(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Trusted void / sent transitions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.void_invoice(p_invoice_id uuid, p_reason text)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices;
  v_reason text := trim(COALESCE(p_reason, ''));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF length(v_reason) = 0 THEN
    RAISE EXCEPTION 'void reason is required';
  END IF;

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT public.can_manage_invoices(v_invoice.organization_id) THEN
    RAISE EXCEPTION 'Not authorized to void invoices for this organization';
  END IF;

  IF v_invoice.lifecycle_status NOT IN ('issued', 'sent') THEN
    RAISE EXCEPTION 'Only issued or sent invoices can be voided';
  END IF;

  UPDATE public.invoices
  SET
    lifecycle_status = 'void',
    voided_at = now(),
    void_reason = v_reason,
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'INVOICE_VOIDED',
    jsonb_build_object('reason', v_reason)
  );

  RETURN v_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.void_invoice(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.void_invoice(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_invoice_sent(p_invoice_id uuid)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices;
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

  IF NOT public.can_manage_invoices(v_invoice.organization_id) THEN
    RAISE EXCEPTION 'Not authorized to mark invoices sent for this organization';
  END IF;

  IF v_invoice.lifecycle_status <> 'issued' THEN
    RAISE EXCEPTION 'Only issued invoices can be marked sent';
  END IF;

  UPDATE public.invoices
  SET
    lifecycle_status = 'sent',
    sent_at = now(),
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'INVOICE_SENT',
    '{}'::jsonb
  );

  RETURN v_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_invoice_sent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_invoice_sent(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_invoice_duplicated(
  p_source_invoice_id uuid,
  p_new_invoice_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source public.invoices;
  v_new public.invoices;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_source FROM public.invoices WHERE id = p_source_invoice_id;
  SELECT * INTO v_new FROM public.invoices WHERE id = p_new_invoice_id;

  IF NOT FOUND OR v_source.id IS NULL OR v_new.id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_source.organization_id IS DISTINCT FROM v_new.organization_id THEN
    RAISE EXCEPTION 'Duplicate invoice organization mismatch';
  END IF;

  IF NOT public.can_manage_invoices(v_new.organization_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  PERFORM public.insert_trusted_invoice_event(
    v_new.organization_id,
    v_new.id,
    'INVOICE_DUPLICATED',
    jsonb_build_object('source_invoice_id', p_source_invoice_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_invoice_duplicated(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_invoice_duplicated(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_events ENABLE ROW LEVEL SECURITY;

-- Brand settings
CREATE POLICY invoice_brand_settings_select_member
  ON public.invoice_brand_settings
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY invoice_brand_settings_insert_manager
  ON public.invoice_brand_settings
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

CREATE POLICY invoice_brand_settings_update_manager
  ON public.invoice_brand_settings
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

CREATE POLICY invoice_sequences_select_manager
  ON public.invoice_sequences
  FOR SELECT
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

CREATE POLICY invoices_select_member
  ON public.invoices
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY invoices_insert_manager
  ON public.invoices
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

-- Draft commercial edits only via UPDATE policy; issued commercial fields
-- are additionally blocked by prevent_issued_invoice_commercial_edit.
CREATE POLICY invoices_update_manager
  ON public.invoices
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

CREATE POLICY invoices_delete_manager_draft
  ON public.invoices
  FOR DELETE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND lifecycle_status = 'draft'
  );

CREATE POLICY invoice_items_select_member
  ON public.invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY invoice_items_insert_manager
  ON public.invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
        AND public.can_manage_invoices(i.organization_id)
    )
  );

CREATE POLICY invoice_items_update_manager
  ON public.invoice_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
        AND public.can_manage_invoices(i.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
        AND public.can_manage_invoices(i.organization_id)
    )
  );

CREATE POLICY invoice_items_delete_manager
  ON public.invoice_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
        AND public.can_manage_invoices(i.organization_id)
    )
  );

CREATE POLICY invoice_events_select_member
  ON public.invoice_events
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

-- Narrow insert: only non-critical events; actor forced to auth.uid() by trigger
CREATE POLICY invoice_events_insert_noncritical
  ON public.invoice_events
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND event_type IN ('INVOICE_CREATED', 'INVOICE_UPDATED')
    AND actor_user_id = auth.uid()
  );

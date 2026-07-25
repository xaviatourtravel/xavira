-- FIN-002D: Invoice payment history + ticketing billing document options
-- Forward-only. Uncommitted; editable before any push.
--
-- Creates a normalized invoice_payments ledger. booking_payments cannot be
-- reused: it is booking-scoped, uses major-unit numeric amounts, has no
-- transaction status, and cannot allocate safely across multiple invoices.
--
-- Successful payments are the sole authority for amount_paid_minor /
-- balance_due_minor after issue. Browser-supplied totals are never trusted.

-- ---------------------------------------------------------------------------
-- Document options on invoices (ticketing billing PDF)
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS include_itinerary_detail boolean NOT NULL DEFAULT false;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_request_note text;

COMMENT ON COLUMN public.invoices.include_itinerary_detail IS
  'When true, ticketing PDFs append compact flight itinerary detail. Default false keeps the customer PDF billing-first.';

COMMENT ON COLUMN public.invoices.payment_request_note IS
  'Customer-facing label for the current payment request (e.g. DP, Pelunasan, Full Payment). Does not change invoice totals.';

-- Reaffirm commercial immutability after FIN-002. Payment aggregates,
-- payment_request_note, include_itinerary_detail, due_date, pdf_*, and
-- lifecycle transitions remain editable after issue.
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
      OR NEW.invoice_type IS DISTINCT FROM OLD.invoice_type
      OR NEW.document_type IS DISTINCT FROM OLD.document_type
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
-- invoice_payments ledger
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  payment_code text NOT NULL,
  amount_minor bigint NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  payment_method text,
  bank_name text,
  account_number_masked text,
  status text NOT NULL DEFAULT 'successful',
  note text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_payments_amount_positive CHECK (amount_minor > 0),
  CONSTRAINT invoice_payments_status_check CHECK (
    status IN ('pending', 'successful', 'failed', 'reversed')
  ),
  CONSTRAINT invoice_payments_code_not_blank CHECK (length(trim(payment_code)) > 0)
);

CREATE UNIQUE INDEX invoice_payments_org_code_unique
  ON public.invoice_payments (organization_id, payment_code);

CREATE INDEX invoice_payments_invoice_paid_at_idx
  ON public.invoice_payments (invoice_id, paid_at DESC);

CREATE INDEX invoice_payments_organization_idx
  ON public.invoice_payments (organization_id, created_at DESC);

CREATE TRIGGER invoice_payments_updated_at
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Parent organization + immutability of parent refs
CREATE OR REPLACE FUNCTION public.validate_invoice_payment_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_invoice_org uuid;
  v_lifecycle text;
BEGIN
  SELECT i.organization_id, i.lifecycle_status
  INTO v_invoice_org, v_lifecycle
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id
  FOR UPDATE;

  IF v_invoice_org IS NULL THEN
    RAISE EXCEPTION 'Invoice payment references unknown invoice';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM v_invoice_org THEN
    RAISE EXCEPTION 'Invoice payment organization_id must match parent invoice';
  END IF;

  IF v_lifecycle = 'void' THEN
    RAISE EXCEPTION 'Cannot record payments against a void invoice';
  END IF;

  IF v_lifecycle = 'draft' THEN
    RAISE EXCEPTION 'Cannot record ledger payments against a draft invoice; use amount_paid_minor on the draft instead';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_payments_validate_refs
  BEFORE INSERT OR UPDATE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_invoice_payment_refs();

-- Prevent moving a payment between invoices / organizations after creation
CREATE OR REPLACE FUNCTION public.prevent_invoice_payment_parent_move()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.invoice_id IS DISTINCT FROM OLD.invoice_id
  THEN
    RAISE EXCEPTION 'Invoice payments cannot be moved between invoices or organizations';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_payments_prevent_parent_move
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_invoice_payment_parent_move();

-- Recalculate invoice aggregates from successful payments only
CREATE OR REPLACE FUNCTION public.recompute_invoice_paid_from_payments(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total bigint;
  v_received bigint;
  v_balance bigint;
  v_status text;
BEGIN
  SELECT total_minor
  INTO v_total
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  SELECT COALESCE(SUM(amount_minor), 0)
  INTO v_received
  FROM public.invoice_payments
  WHERE invoice_id = p_invoice_id
    AND status = 'successful';

  IF v_received > v_total THEN
    RAISE EXCEPTION 'Successful payments exceed invoice total';
  END IF;

  v_balance := v_total - v_received;
  IF v_received = 0 THEN
    v_status := 'unpaid';
  ELSIF v_balance = 0 THEN
    v_status := 'paid';
  ELSE
    v_status := 'partially_paid';
  END IF;

  UPDATE public.invoices
  SET
    amount_paid_minor = v_received,
    balance_due_minor = v_balance,
    payment_status = v_status
  WHERE id = p_invoice_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_invoice_paid_from_payments(uuid) FROM PUBLIC;

-- Trusted RPC: record a payment and recompute aggregates atomically
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_invoice_id uuid,
  p_payment_code text,
  p_amount_minor bigint,
  p_paid_at timestamptz DEFAULT now(),
  p_payment_method text DEFAULT NULL,
  p_bank_name text DEFAULT NULL,
  p_account_number_masked text DEFAULT NULL,
  p_status text DEFAULT 'successful',
  p_note text DEFAULT NULL
)
RETURNS public.invoice_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices%ROWTYPE;
  v_payment public.invoice_payments%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT public.can_manage_invoices(v_invoice.organization_id) THEN
    RAISE EXCEPTION 'Not authorized to record invoice payments';
  END IF;

  IF v_invoice.lifecycle_status NOT IN ('issued', 'sent') THEN
    RAISE EXCEPTION 'Payments can only be recorded on issued invoices';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('pending', 'successful', 'failed', 'reversed') THEN
    RAISE EXCEPTION 'Invalid payment status';
  END IF;

  IF p_amount_minor IS NULL OR p_amount_minor <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be a positive integer';
  END IF;

  INSERT INTO public.invoice_payments (
    organization_id,
    invoice_id,
    payment_code,
    amount_minor,
    paid_at,
    payment_method,
    bank_name,
    account_number_masked,
    status,
    note,
    created_by
  )
  VALUES (
    v_invoice.organization_id,
    v_invoice.id,
    upper(trim(p_payment_code)),
    p_amount_minor,
    COALESCE(p_paid_at, now()),
    NULLIF(trim(COALESCE(p_payment_method, '')), ''),
    NULLIF(trim(COALESCE(p_bank_name, '')), ''),
    NULLIF(trim(COALESCE(p_account_number_masked, '')), ''),
    p_status,
    NULLIF(trim(COALESCE(p_note, '')), ''),
    v_actor
  )
  RETURNING * INTO v_payment;

  PERFORM public.recompute_invoice_paid_from_payments(v_invoice.id);

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'INVOICE_PAYMENT_RECORDED',
    jsonb_build_object(
      'payment_id', v_payment.id,
      'payment_code', v_payment.payment_code,
      'amount_minor', v_payment.amount_minor,
      'status', v_payment.status
    )
  );

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.record_invoice_payment(
  uuid, text, bigint, timestamptz, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment(
  uuid, text, bigint, timestamptz, text, text, text, text, text
) TO authenticated;

-- Status changes also recompute (failed/reversed must drop out of received)
CREATE OR REPLACE FUNCTION public.invoice_payments_after_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_invoice_paid_from_payments(OLD.invoice_id);
    RETURN OLD;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.amount_minor IS DISTINCT FROM OLD.amount_minor
  THEN
    PERFORM public.recompute_invoice_paid_from_payments(NEW.invoice_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_payments_recompute_after_change
  AFTER UPDATE OF status, amount_minor OR DELETE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.invoice_payments_after_status_change();

-- Expand invoice_events allowed types for payment audit
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
      'PDF_DOWNLOADED',
      'INVOICE_PAYMENT_RECORDED',
      'INVOICE_PAYMENT_UPDATED'
    )
  );

-- Treat payment events as trusted (SECURITY DEFINER path only)
CREATE OR REPLACE FUNCTION public.guard_invoice_event_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_trusted text;
BEGIN
  NEW.actor_user_id := auth.uid();
  v_trusted := nullif(current_setting('app.trusted_invoice_event', true), '');

  IF NEW.event_type IN (
    'INVOICE_ISSUED',
    'INVOICE_SENT',
    'INVOICE_VOIDED',
    'INVOICE_DUPLICATED',
    'PDF_GENERATION_STARTED',
    'PDF_GENERATED',
    'PDF_GENERATION_FAILED',
    'INVOICE_PAYMENT_RECORDED',
    'INVOICE_PAYMENT_UPDATED'
  ) THEN
    IF COALESCE(v_trusted, '') <> '1' THEN
      RAISE EXCEPTION 'Critical invoice events can only be written by trusted functions';
    END IF;
  ELSIF NEW.event_type IN ('INVOICE_CREATED', 'INVOICE_UPDATED', 'PDF_DOWNLOADED') THEN
    IF NEW.organization_id IS DISTINCT FROM public.get_my_organization_id() THEN
      RAISE EXCEPTION 'Event organization mismatch';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown invoice event type';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_payments_select_member
  ON public.invoice_payments
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY invoice_payments_insert_manager
  ON public.invoice_payments
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_id
        AND i.organization_id = organization_id
        AND i.lifecycle_status IN ('issued', 'sent')
    )
  );

CREATE POLICY invoice_payments_update_manager
  ON public.invoice_payments
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

CREATE POLICY invoice_payments_delete_manager
  ON public.invoice_payments
  FOR DELETE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
  );

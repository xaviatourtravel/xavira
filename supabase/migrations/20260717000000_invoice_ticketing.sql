-- FIN-002: Ticketing invoice & flight itinerary MVP
-- Forward-only. Builds on the existing invoice domain; does not replace it.
--
-- Design:
--   * invoices gains invoice_type ('package' | 'ticketing') and document_type
--     ('invoice' | 'proforma'). Existing rows default to package/invoice so the
--     current package workflow is unchanged.
--   * Flight data lives in normalized child tables (invoice_ticket_groups,
--     invoice_flight_segments). Money authority stays with invoice_items and the
--     existing calculator — ticket tables never store totals.
--   * Immutability mirrors invoice_items: child rows are editable only while the
--     parent invoice is a draft, and are frozen once issued/sent/void. The issued
--     PDF renders from these frozen rows, so later parser/branding/customer edits
--     never change an issued invoice.

-- ---------------------------------------------------------------------------
-- 1. Invoice type + document type
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN invoice_type text NOT NULL DEFAULT 'package',
  ADD COLUMN document_type text NOT NULL DEFAULT 'invoice';

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_invoice_type_check
    CHECK (invoice_type IN ('package', 'ticketing')),
  ADD CONSTRAINT invoices_document_type_check
    CHECK (document_type IN ('invoice', 'proforma'));

CREATE INDEX invoices_organization_invoice_type_idx
  ON public.invoices (organization_id, invoice_type);

-- ---------------------------------------------------------------------------
-- 2. Lock invoice_type / document_type after issue (extend existing guard)
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
-- 3. Ticket groups
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_ticket_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  pnr_code text NOT NULL,
  passenger_count integer NOT NULL DEFAULT 1,
  trip_type text NOT NULL DEFAULT 'one_way',
  primary_airline_code text,
  departure_date date,
  return_date date,
  raw_itinerary text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_ticket_groups_trip_type_check
    CHECK (trip_type IN ('one_way', 'round_trip', 'multi_city')),
  CONSTRAINT invoice_ticket_groups_passenger_count_positive
    CHECK (passenger_count > 0),
  CONSTRAINT invoice_ticket_groups_pnr_not_blank
    CHECK (length(trim(pnr_code)) > 0)
);

CREATE INDEX invoice_ticket_groups_invoice_idx
  ON public.invoice_ticket_groups (invoice_id, sort_order);
CREATE INDEX invoice_ticket_groups_organization_idx
  ON public.invoice_ticket_groups (organization_id);

CREATE TRIGGER invoice_ticket_groups_updated_at
  BEFORE UPDATE ON public.invoice_ticket_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Flight segments
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_flight_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  ticket_group_id uuid NOT NULL REFERENCES public.invoice_ticket_groups (id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound',
  segment_order integer NOT NULL DEFAULT 0,
  airline_code text NOT NULL,
  flight_number text NOT NULL,
  booking_class text,
  departure_airport text NOT NULL,
  arrival_airport text NOT NULL,
  departure_local_date text,
  departure_local_time text,
  arrival_local_date text,
  arrival_local_time text,
  arrival_day_offset integer NOT NULL DEFAULT 0,
  status text,
  raw_segment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_flight_segments_direction_check
    CHECK (direction IN ('outbound', 'return', 'other')),
  CONSTRAINT invoice_flight_segments_airports_check
    CHECK (
      departure_airport ~ '^[A-Z]{3}$'
      AND arrival_airport ~ '^[A-Z]{3}$'
      AND departure_airport <> arrival_airport
    ),
  CONSTRAINT invoice_flight_segments_airline_check
    CHECK (airline_code ~ '^[A-Z0-9]{2,3}$'),
  CONSTRAINT invoice_flight_segments_offset_non_negative
    CHECK (arrival_day_offset >= 0)
);

CREATE INDEX invoice_flight_segments_group_idx
  ON public.invoice_flight_segments (ticket_group_id, segment_order);
CREATE INDEX invoice_flight_segments_invoice_idx
  ON public.invoice_flight_segments (invoice_id);
CREATE INDEX invoice_flight_segments_organization_idx
  ON public.invoice_flight_segments (organization_id);

CREATE TRIGGER invoice_flight_segments_updated_at
  BEFORE UPDATE ON public.invoice_flight_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Cross-organization reference protection
--    Child organization_id must equal the parent invoice's organization_id.
--    Ticket rows may only attach to ticketing invoices.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_ticket_group_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_invoice_org uuid;
  v_invoice_type text;
BEGIN
  SELECT i.organization_id, i.invoice_type
  INTO v_invoice_org, v_invoice_type
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id;

  IF v_invoice_org IS NULL THEN
    RAISE EXCEPTION 'Ticket group must reference an existing invoice';
  END IF;
  IF NEW.organization_id IS DISTINCT FROM v_invoice_org THEN
    RAISE EXCEPTION 'Ticket group organization must match its invoice';
  END IF;
  IF v_invoice_type IS DISTINCT FROM 'ticketing' THEN
    RAISE EXCEPTION 'Ticket groups can only attach to ticketing invoices';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_ticket_groups_validate_refs
  BEFORE INSERT OR UPDATE OF organization_id, invoice_id
  ON public.invoice_ticket_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ticket_group_refs();

CREATE OR REPLACE FUNCTION public.validate_flight_segment_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_group_org uuid;
  v_group_invoice uuid;
  v_invoice_org uuid;
  v_invoice_type text;
BEGIN
  SELECT g.organization_id, g.invoice_id
  INTO v_group_org, v_group_invoice
  FROM public.invoice_ticket_groups g
  WHERE g.id = NEW.ticket_group_id;

  IF v_group_org IS NULL THEN
    RAISE EXCEPTION 'Flight segment must reference an existing ticket group';
  END IF;
  IF NEW.invoice_id IS DISTINCT FROM v_group_invoice THEN
    RAISE EXCEPTION 'Flight segment invoice must match its ticket group';
  END IF;
  IF NEW.organization_id IS DISTINCT FROM v_group_org THEN
    RAISE EXCEPTION 'Flight segment organization must match its ticket group';
  END IF;

  SELECT i.organization_id, i.invoice_type
  INTO v_invoice_org, v_invoice_type
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id;

  IF v_invoice_org IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Flight segment organization must match its invoice';
  END IF;
  IF v_invoice_type IS DISTINCT FROM 'ticketing' THEN
    RAISE EXCEPTION 'Flight segments can only attach to ticketing invoices';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_flight_segments_validate_refs
  BEFORE INSERT OR UPDATE OF organization_id, invoice_id, ticket_group_id
  ON public.invoice_flight_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_flight_segment_refs();

-- ---------------------------------------------------------------------------
-- 6. Immutability after issue (mirror of invoice_items guard)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_issued_ticket_group_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_lifecycle text;
BEGIN
  SELECT i.lifecycle_status
  INTO v_lifecycle
  FROM public.invoices i
  WHERE i.id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  IF v_lifecycle IN ('issued', 'sent', 'void') THEN
    RAISE EXCEPTION 'Issued invoice ticket groups cannot be edited';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_ticket_groups_prevent_issued_edit
  BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_ticket_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_issued_ticket_group_edit();

CREATE OR REPLACE FUNCTION public.prevent_issued_flight_segment_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_lifecycle text;
BEGIN
  SELECT i.lifecycle_status
  INTO v_lifecycle
  FROM public.invoices i
  WHERE i.id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  IF v_lifecycle IN ('issued', 'sent', 'void') THEN
    RAISE EXCEPTION 'Issued invoice flight segments cannot be edited';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_flight_segments_prevent_issued_edit
  BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_flight_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_issued_flight_segment_edit();

-- ---------------------------------------------------------------------------
-- 7. Issue-time validation: a ticketing invoice must have flight data
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_ticketing_invoice_on_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_group_count integer;
  v_empty_group_count integer;
BEGIN
  IF NEW.invoice_type = 'ticketing'
    AND NEW.lifecycle_status = 'issued'
    AND OLD.lifecycle_status = 'draft'
  THEN
    SELECT count(*) INTO v_group_count
    FROM public.invoice_ticket_groups g
    WHERE g.invoice_id = NEW.id;

    IF v_group_count = 0 THEN
      RAISE EXCEPTION 'Ticketing invoice must have at least one ticket group before issue';
    END IF;

    SELECT count(*) INTO v_empty_group_count
    FROM public.invoice_ticket_groups g
    WHERE g.invoice_id = NEW.id
      AND NOT EXISTS (
        SELECT 1 FROM public.invoice_flight_segments s
        WHERE s.ticket_group_id = g.id
      );

    IF v_empty_group_count > 0 THEN
      RAISE EXCEPTION 'Every ticket group must have at least one flight segment before issue';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoices_validate_ticketing_on_issue
  BEFORE UPDATE OF lifecycle_status ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ticketing_invoice_on_issue();

-- ---------------------------------------------------------------------------
-- 8. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_ticket_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_flight_segments ENABLE ROW LEVEL SECURITY;

-- Ticket groups
CREATE POLICY invoice_ticket_groups_select_member
  ON public.invoice_ticket_groups
  FOR SELECT
  USING (
    organization_id = public.get_my_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_ticket_groups.invoice_id
        AND i.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY invoice_ticket_groups_insert_manager
  ON public.invoice_ticket_groups
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_ticket_groups.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
        AND i.invoice_type = 'ticketing'
    )
  );

CREATE POLICY invoice_ticket_groups_update_manager
  ON public.invoice_ticket_groups
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_ticket_groups.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
    )
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_ticket_groups.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
    )
  );

CREATE POLICY invoice_ticket_groups_delete_manager
  ON public.invoice_ticket_groups
  FOR DELETE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_ticket_groups.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
    )
  );

-- Flight segments
CREATE POLICY invoice_flight_segments_select_member
  ON public.invoice_flight_segments
  FOR SELECT
  USING (
    organization_id = public.get_my_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_flight_segments.invoice_id
        AND i.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY invoice_flight_segments_insert_manager
  ON public.invoice_flight_segments
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_flight_segments.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
        AND i.invoice_type = 'ticketing'
    )
    AND EXISTS (
      SELECT 1 FROM public.invoice_ticket_groups g
      WHERE g.id = invoice_flight_segments.ticket_group_id
        AND g.organization_id = public.get_my_organization_id()
        AND g.invoice_id = invoice_flight_segments.invoice_id
    )
  );

CREATE POLICY invoice_flight_segments_update_manager
  ON public.invoice_flight_segments
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_flight_segments.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
    )
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_flight_segments.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
    )
  );

CREATE POLICY invoice_flight_segments_delete_manager
  ON public.invoice_flight_segments
  FOR DELETE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.can_manage_invoices(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_flight_segments.invoice_id
        AND i.organization_id = public.get_my_organization_id()
        AND i.lifecycle_status = 'draft'
    )
  );

-- ---------------------------------------------------------------------------
-- 9. Concurrent edit protection: ticket mutations lock parent invoice first
--    Deterministic order with issue_invoice:
--      invoice → ticket groups (sort_order, id) → segments (group, order, id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_parent_invoice_for_ticket_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_invoice_id uuid;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF v_invoice_id IS NULL THEN
    RAISE EXCEPTION 'Ticket row must reference an invoice';
  END IF;

  -- Serialize with issue_invoice which also locks the invoice FOR UPDATE.
  PERFORM 1
  FROM public.invoices i
  WHERE i.id = v_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket row must reference an existing invoice';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_ticket_groups_lock_parent
  BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_ticket_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_parent_invoice_for_ticket_mutation();

CREATE TRIGGER invoice_flight_segments_lock_parent
  BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_flight_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_parent_invoice_for_ticket_mutation();

-- Parent refs are immutable after insert (cannot move between invoices/groups).
CREATE OR REPLACE FUNCTION public.prevent_ticket_parent_ref_move()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'invoice_ticket_groups' THEN
    IF NEW.invoice_id IS DISTINCT FROM OLD.invoice_id
      OR NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Ticket group cannot be moved between invoices or organizations';
    END IF;
  ELSIF TG_TABLE_NAME = 'invoice_flight_segments' THEN
    IF NEW.invoice_id IS DISTINCT FROM OLD.invoice_id
      OR NEW.ticket_group_id IS DISTINCT FROM OLD.ticket_group_id
      OR NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Flight segment cannot be moved between invoices or ticket groups';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_ticket_groups_prevent_move
  BEFORE UPDATE ON public.invoice_ticket_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ticket_parent_ref_move();

CREATE TRIGGER invoice_flight_segments_prevent_move
  BEFORE UPDATE ON public.invoice_flight_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ticket_parent_ref_move();

-- ---------------------------------------------------------------------------
-- 10. Ticketing validation helpers (used inside issue_invoice)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_and_validate_ticketing_for_issue(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_group record;
  v_group_count integer := 0;
  v_segment_count integer;
  v_total_pax integer := 0;
  v_pax_qty numeric := 0;
  v_pax_lines integer := 0;
BEGIN
  -- Lock order (deterministic): groups by sort_order, id → segments by
  -- ticket_group_id, segment_order, id. Parent invoice is already locked
  -- by the caller (issue_invoice).
  FOR v_group IN
    SELECT g.id, g.organization_id, g.invoice_id, g.passenger_count, g.pnr_code
    FROM public.invoice_ticket_groups g
    WHERE g.invoice_id = p_invoice_id
    ORDER BY g.sort_order, g.id
    FOR UPDATE
  LOOP
    v_group_count := v_group_count + 1;

    IF v_group.organization_id IS DISTINCT FROM (
      SELECT i.organization_id FROM public.invoices i WHERE i.id = p_invoice_id
    ) THEN
      RAISE EXCEPTION 'Ticket group organization must match its invoice';
    END IF;

    IF v_group.invoice_id IS DISTINCT FROM p_invoice_id THEN
      RAISE EXCEPTION 'Ticket group invoice mismatch';
    END IF;

    IF length(trim(COALESCE(v_group.pnr_code, ''))) = 0 THEN
      RAISE EXCEPTION 'Ticket group PNR is required before issue';
    END IF;

    IF v_group.passenger_count IS NULL OR v_group.passenger_count <= 0 THEN
      RAISE EXCEPTION 'Ticket group passenger count must be positive';
    END IF;

    v_total_pax := v_total_pax + v_group.passenger_count;

    -- Lock segments for this group (deterministic order).
    PERFORM 1
    FROM public.invoice_flight_segments s
    WHERE s.ticket_group_id = v_group.id
      AND s.invoice_id = p_invoice_id
    ORDER BY s.ticket_group_id, s.segment_order, s.id
    FOR UPDATE;

    SELECT count(*)
    INTO v_segment_count
    FROM public.invoice_flight_segments s
    WHERE s.ticket_group_id = v_group.id
      AND s.invoice_id = p_invoice_id;

    IF v_segment_count = 0 THEN
      RAISE EXCEPTION 'Every ticket group must have at least one flight segment before issue';
    END IF;

    -- Reject cross-org / cross-invoice segment refs while rows are locked.
    IF EXISTS (
      SELECT 1
      FROM public.invoice_flight_segments s
      WHERE s.ticket_group_id = v_group.id
        AND (
          s.invoice_id IS DISTINCT FROM p_invoice_id
          OR s.organization_id IS DISTINCT FROM v_group.organization_id
        )
    ) THEN
      RAISE EXCEPTION 'Flight segment references must match ticket group and invoice';
    END IF;
  END LOOP;

  IF v_group_count = 0 THEN
    RAISE EXCEPTION 'Ticketing invoice must have at least one ticket group before issue';
  END IF;

  -- Pricing authority: persisted invoice_items (unit = pax) must match passengers.
  -- Client totals are ignored; recalculate_invoice_totals remains money authority.
  SELECT
    COALESCE(sum(ii.quantity), 0),
    count(*)
  INTO v_pax_qty, v_pax_lines
  FROM public.invoice_items ii
  WHERE ii.invoice_id = p_invoice_id
    AND lower(ii.unit) = 'pax';

  IF v_pax_lines = 0 THEN
    RAISE EXCEPTION 'Ticketing invoice requires at least one pax line item';
  END IF;

  IF v_pax_qty <> v_total_pax THEN
    RAISE EXCEPTION 'Ticket passenger count must match pax line item quantity';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_and_validate_ticketing_for_issue(uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 11. Hardened issue_invoice — ticketing locks + validation inside same txn
--     Signature unchanged: issue_invoice(p_invoice_id uuid) ONLY.
--     Caller never supplies snapshots, actor, org, or ticketing JSON.
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

  -- 1. Lock invoice row FOR UPDATE (first in lock order).
  SELECT *
  INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- 3–4. Derive organization and verify permission from locked row.
  v_org_id := v_invoice.organization_id;

  IF NOT public.can_manage_invoices(v_org_id) THEN
    RAISE EXCEPTION 'Not authorized to issue invoices for this organization';
  END IF;

  -- 2. Verify lifecycle is draft.
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

  -- 5. Lock invoice_items (deterministic). recalculate also locks them;
  --    this explicit lock documents the contract and runs before ticket locks.
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

  -- 6–11. Ticketing: lock groups → segments, validate refs + commercial data.
  -- Package invoices skip this block entirely (no ticket triggers fire).
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

  -- 12. Recalculate totals (authoritative; rejects overpayment / bad money).
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

  -- 14. Allocate invoice number (sequence locked).
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

  -- 13 + 15. Freeze snapshots and transition to issued (child ticket rows
  -- become immutable via prevent_issued_* triggers; PDF reads those rows).
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

  -- 16. Trusted audit event (only after successful transition).
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

-- Defense-in-depth: still reject empty ticketing invoices if lifecycle flips
-- via any other path. Primary validation is inside issue_invoice above.
-- (validate_ticketing_invoice_on_issue trigger already created in section 7.)

-- ---------------------------------------------------------------------------
-- 12. Atomic duplicate_invoice_as_draft — one txn for header/items/tickets/event
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
    v_source.template_key,
    COALESCE(v_source.template_version, 1),
    COALESCE(v_source.theme_snapshot, '{}'::jsonb),
    COALESCE(v_source.company_snapshot, '{}'::jsonb),
    COALESCE(v_source.customer_snapshot, '{}'::jsonb),
    CASE
      WHEN v_source.recipient_source = 'manual' THEN NULL
      ELSE v_source.booking_snapshot
    END,
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

  -- Event only after successful full copy (rolls back with the txn on failure).
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

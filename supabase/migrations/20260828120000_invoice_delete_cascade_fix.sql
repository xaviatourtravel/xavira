-- FIN-003A: Fix draft/ticketing cascade delete + permanent delete for archived invoices
-- Forward-only. Does not edit FIN-002 / FIN-003 migrations.

-- ---------------------------------------------------------------------------
-- 1. Fix lock_parent_invoice_for_ticket_mutation
-- Root cause of: "Ticket row must reference an existing invoice"
-- During parent invoice DELETE, ON DELETE CASCADE removes ticket rows.
-- BEFORE DELETE on children tried FOR UPDATE on a parent that is already
-- gone from the deleting statement's visibility → false integrity failure.
-- INSERT/UPDATE still require a living parent.
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

  -- Cascade from parent invoice delete: parent may already be invisible.
  -- Allow legitimate child DELETE; never invent a parent for INSERT/UPDATE.
  IF TG_OP = 'DELETE' THEN
    PERFORM 1
    FROM public.invoices i
    WHERE i.id = v_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN OLD;
    END IF;

    RETURN OLD;
  END IF;

  PERFORM 1
  FROM public.invoices i
  WHERE i.id = v_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket row must reference an existing invoice';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Allow trusted cascade delete of issued children (items / tickets)
-- Manual child DELETE of issued invoices remains blocked.
-- Trusted path: app.trusted_invoice_delete = '1' (set inside delete RPCs).
-- Also allow DELETE when parent invoice row is already gone (cascade).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_issued_invoice_item_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  invoice_lifecycle text;
  v_trusted text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_trusted := nullif(current_setting('app.trusted_invoice_delete', true), '');
    IF COALESCE(v_trusted, '') = '1' THEN
      RETURN OLD;
    END IF;

    SELECT i.lifecycle_status
    INTO invoice_lifecycle
    FROM public.invoices i
    WHERE i.id = OLD.invoice_id;

    IF NOT FOUND THEN
      RETURN OLD;
    END IF;

    IF invoice_lifecycle IN ('issued', 'sent', 'void') THEN
      RAISE EXCEPTION 'Issued invoice items cannot be edited';
    END IF;

    RETURN OLD;
  END IF;

  SELECT i.lifecycle_status
  INTO invoice_lifecycle
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id;

  IF invoice_lifecycle IN ('issued', 'sent', 'void') THEN
    RAISE EXCEPTION 'Issued invoice items cannot be edited';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_issued_ticket_group_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_lifecycle text;
  v_trusted text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_trusted := nullif(current_setting('app.trusted_invoice_delete', true), '');
    IF COALESCE(v_trusted, '') = '1' THEN
      RETURN OLD;
    END IF;

    SELECT i.lifecycle_status
    INTO v_lifecycle
    FROM public.invoices i
    WHERE i.id = OLD.invoice_id;

    IF NOT FOUND THEN
      RETURN OLD;
    END IF;

    IF v_lifecycle IN ('issued', 'sent', 'void') THEN
      RAISE EXCEPTION 'Issued invoice ticket groups cannot be edited';
    END IF;

    RETURN OLD;
  END IF;

  SELECT i.lifecycle_status
  INTO v_lifecycle
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id;

  IF v_lifecycle IN ('issued', 'sent', 'void') THEN
    RAISE EXCEPTION 'Issued invoice ticket groups cannot be edited';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_issued_flight_segment_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_lifecycle text;
  v_trusted text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_trusted := nullif(current_setting('app.trusted_invoice_delete', true), '');
    IF COALESCE(v_trusted, '') = '1' THEN
      RETURN OLD;
    END IF;

    SELECT i.lifecycle_status
    INTO v_lifecycle
    FROM public.invoices i
    WHERE i.id = OLD.invoice_id;

    IF NOT FOUND THEN
      RETURN OLD;
    END IF;

    IF v_lifecycle IN ('issued', 'sent', 'void') THEN
      RAISE EXCEPTION 'Issued invoice flight segments cannot be edited';
    END IF;

    RETURN OLD;
  END IF;

  SELECT i.lifecycle_status
  INTO v_lifecycle
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id;

  IF v_lifecycle IN ('issued', 'sent', 'void') THEN
    RAISE EXCEPTION 'Issued invoice flight segments cannot be edited';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Patch delete_draft_invoice to set trusted delete flag before CASCADE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_draft_invoice(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices%ROWTYPE;
  v_payment_count integer;
  v_result jsonb;
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
    RAISE EXCEPTION 'Not authorized to delete invoices for this organization';
  END IF;

  IF v_invoice.lifecycle_status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft invoices can be permanently deleted';
  END IF;

  IF v_invoice.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Use delete_archived_invoice for archived invoices';
  END IF;

  SELECT count(*)::integer
  INTO v_payment_count
  FROM public.invoice_payments
  WHERE invoice_id = v_invoice.id;

  IF v_payment_count > 0 THEN
    RAISE EXCEPTION 'Draft invoice has payment history and cannot be permanently deleted';
  END IF;

  v_result := jsonb_build_object(
    'invoice_id', v_invoice.id,
    'organization_id', v_invoice.organization_id,
    'pdf_storage_path', v_invoice.pdf_storage_path,
    'logo_asset_path', v_invoice.logo_asset_path
  );

  PERFORM set_config('app.trusted_invoice_delete', '1', true);

  DELETE FROM public.invoices
  WHERE id = v_invoice.id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_draft_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_draft_invoice(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. delete_archived_invoice — permanent delete for archived rows only
-- Requires owner/admin (stricter than draft delete). Blocks if any payments.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_permanently_delete_archived_invoices(
  p_organization_id uuid
)
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

  -- Strongest privileged roles for irreversible cleanup of archived invoices.
  RETURN v_role IN ('owner', 'admin');
END;
$$;

REVOKE ALL ON FUNCTION public.can_permanently_delete_archived_invoices(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_permanently_delete_archived_invoices(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_archived_invoice(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices%ROWTYPE;
  v_payment_count integer;
  v_result jsonb;
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

  IF NOT public.can_permanently_delete_archived_invoices(v_invoice.organization_id) THEN
    RAISE EXCEPTION 'Not authorized to permanently delete archived invoices';
  END IF;

  IF v_invoice.archived_at IS NULL THEN
    RAISE EXCEPTION 'Only archived invoices can be permanently deleted with this operation';
  END IF;

  SELECT count(*)::integer
  INTO v_payment_count
  FROM public.invoice_payments
  WHERE invoice_id = v_invoice.id;

  IF v_payment_count > 0 THEN
    RAISE EXCEPTION 'Invoice memiliki riwayat pembayaran dan tidak dapat dihapus permanen.';
  END IF;

  v_result := jsonb_build_object(
    'invoice_id', v_invoice.id,
    'organization_id', v_invoice.organization_id,
    'pdf_storage_path', v_invoice.pdf_storage_path,
    'logo_asset_path', v_invoice.logo_asset_path,
    'invoice_number', v_invoice.invoice_number,
    'lifecycle_status', v_invoice.lifecycle_status
  );

  PERFORM set_config('app.trusted_invoice_delete', '1', true);

  DELETE FROM public.invoices
  WHERE id = v_invoice.id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_archived_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_archived_invoice(uuid) TO authenticated;

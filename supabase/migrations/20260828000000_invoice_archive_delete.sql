-- FIN-003: Safe invoice delete (draft) + archive/restore (issued/sent/void)
-- Forward-only. Does not hard-delete issued invoices.

-- ---------------------------------------------------------------------------
-- Archive columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason text;

COMMENT ON COLUMN public.invoices.archived_at IS
  'When set, invoice is hidden from the default operational list. Number, payments, PDF, and audit remain.';

CREATE INDEX IF NOT EXISTS invoices_org_archived_at_idx
  ON public.invoices (organization_id, archived_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS invoices_org_active_created_idx
  ON public.invoices (organization_id, created_at DESC)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Prevent client forgery of archive fields
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_client_invoice_archive_state_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_trusted text;
BEGIN
  v_trusted := nullif(current_setting('app.trusted_invoice_archive', true), '');

  IF COALESCE(v_trusted, '') = '1' THEN
    RETURN NEW;
  END IF;

  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at
    OR NEW.archived_by IS DISTINCT FROM OLD.archived_by
    OR NEW.archive_reason IS DISTINCT FROM OLD.archive_reason
  THEN
    RAISE EXCEPTION 'Archive state can only be changed by trusted invoice RPCs';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_prevent_client_archive_state_edit ON public.invoices;
CREATE TRIGGER invoices_prevent_client_archive_state_edit
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_invoice_archive_state_edit();

-- ---------------------------------------------------------------------------
-- Event types: archive / restore / deleted (deleted used only if row survives;
-- draft hard-delete cascades events — org audit_logs used from app layer)
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
      'INVOICE_ARCHIVED',
      'INVOICE_RESTORED',
      'INVOICE_DELETED',
      'PDF_GENERATION_STARTED',
      'PDF_GENERATED',
      'PDF_GENERATION_FAILED',
      'PDF_DOWNLOADED',
      'INVOICE_PAYMENT_RECORDED',
      'INVOICE_PAYMENT_UPDATED'
    )
  );

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

  NEW.actor_user_id := auth.uid();

  v_trusted := nullif(current_setting('app.trusted_invoice_event', true), '');

  IF NEW.event_type IN (
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
    'INVOICE_PAYMENT_RECORDED',
    'INVOICE_PAYMENT_UPDATED'
  ) THEN
    IF COALESCE(v_trusted, '') <> '1' THEN
      RAISE EXCEPTION 'Critical invoice events require trusted insert path';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- archive_invoice — issued / sent / void only (never hard-delete)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.archive_invoice(
  p_invoice_id uuid,
  p_reason text
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices%ROWTYPE;
  v_reason text := trim(COALESCE(p_reason, ''));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF length(v_reason) = 0 THEN
    RAISE EXCEPTION 'archive reason is required';
  END IF;

  IF length(v_reason) > 1000 THEN
    RAISE EXCEPTION 'archive reason is too long';
  END IF;

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT public.can_manage_invoices(v_invoice.organization_id) THEN
    RAISE EXCEPTION 'Not authorized to archive invoices for this organization';
  END IF;

  IF v_invoice.lifecycle_status = 'draft' THEN
    RAISE EXCEPTION 'Draft invoices must be permanently deleted, not archived';
  END IF;

  IF v_invoice.lifecycle_status NOT IN ('issued', 'sent', 'void') THEN
    RAISE EXCEPTION 'Only issued, sent, or void invoices can be archived';
  END IF;

  -- Idempotent: already archived
  IF v_invoice.archived_at IS NOT NULL THEN
    RETURN v_invoice;
  END IF;

  PERFORM set_config('app.trusted_invoice_archive', '1', true);

  UPDATE public.invoices
  SET
    archived_at = now(),
    archived_by = v_actor,
    archive_reason = v_reason,
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'INVOICE_ARCHIVED',
    jsonb_build_object('reason', v_reason)
  );

  RETURN v_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_invoice(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_invoice(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- restore_invoice — clear archive fields; preserve archive history in events
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_invoice(p_invoice_id uuid)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices%ROWTYPE;
  v_prev_reason text;
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
    RAISE EXCEPTION 'Not authorized to restore invoices for this organization';
  END IF;

  IF v_invoice.archived_at IS NULL THEN
    RETURN v_invoice;
  END IF;

  v_prev_reason := v_invoice.archive_reason;

  PERFORM set_config('app.trusted_invoice_archive', '1', true);

  UPDATE public.invoices
  SET
    archived_at = NULL,
    archived_by = NULL,
    -- Keep archive_reason for operator context; restore event records recovery.
    updated_by = v_actor
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  PERFORM public.insert_trusted_invoice_event(
    v_invoice.organization_id,
    v_invoice.id,
    'INVOICE_RESTORED',
    jsonb_build_object(
      'previous_archive_reason', v_prev_reason
    )
  );

  RETURN v_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_invoice(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- delete_draft_invoice — permanent delete for drafts only
-- Blocks if any invoice_payments rows exist (financial history safety).
-- Returns storage paths for best-effort app-side cleanup (DB commit first).
-- Child rows cascade: items, events, ticket groups, flight segments, payments.
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
    RAISE EXCEPTION 'Archived invoices cannot be permanently deleted';
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

  -- Hard delete; children CASCADE. invoice_events for this row are removed.
  DELETE FROM public.invoices
  WHERE id = v_invoice.id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_draft_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_draft_invoice(uuid) TO authenticated;

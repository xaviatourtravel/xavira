-- 006_rls.sql
-- Row Level Security policies

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select_member
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (id = public.get_my_organization_id());

CREATE POLICY organizations_insert_authenticated
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY organizations_update_owner
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (id = public.get_my_organization_id() AND public.is_org_owner())
  WITH CHECK (id = public.get_my_organization_id() AND public.is_org_owner());

CREATE POLICY organizations_delete_owner
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (id = public.get_my_organization_id() AND public.is_org_owner());

CREATE POLICY profiles_select_org_member
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY profiles_insert_self
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_self_or_admin
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND (
      id = auth.uid()
      OR public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND (
      id = auth.uid()
      OR public.is_org_admin_or_owner()
    )
  );

CREATE POLICY profiles_delete_admin
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
    AND id <> auth.uid()
  );

CREATE POLICY subscriptions_select_admin_or_owner
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY subscriptions_insert_owner
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_owner()
  );

CREATE POLICY subscriptions_update_owner
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_owner()
  );

CREATE POLICY subscriptions_delete_owner
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_owner()
  );

CREATE POLICY packages_select_member
  ON public.packages
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY packages_insert_admin
  ON public.packages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY packages_update_admin
  ON public.packages
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY packages_delete_admin
  ON public.packages
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY knowledge_bases_select_member
  ON public.knowledge_bases
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY knowledge_bases_insert_admin
  ON public.knowledge_bases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY knowledge_bases_update_admin
  ON public.knowledge_bases
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY knowledge_bases_delete_admin
  ON public.knowledge_bases
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY knowledge_documents_select_member
  ON public.knowledge_documents
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY knowledge_documents_insert_admin
  ON public.knowledge_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY knowledge_documents_update_admin
  ON public.knowledge_documents
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY knowledge_documents_delete_admin
  ON public.knowledge_documents
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY leads_select_member
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND deleted_at IS NULL
  );

CREATE POLICY leads_insert_member
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_my_organization_id());

CREATE POLICY leads_update_member
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND (
      public.is_org_admin_or_owner()
      OR assigned_to = auth.uid()
      OR assigned_to IS NULL
    )
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND (
      public.is_org_admin_or_owner()
      OR assigned_to = auth.uid()
      OR assigned_to IS NULL
    )
  );

CREATE POLICY leads_delete_admin
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY lead_activities_select_member
  ON public.lead_activities
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY lead_activities_insert_member
  ON public.lead_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_my_organization_id());

CREATE POLICY lead_activities_update_admin
  ON public.lead_activities
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY lead_activities_delete_admin
  ON public.lead_activities
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY lead_scores_select_member
  ON public.lead_scores
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY lead_scores_insert_member
  ON public.lead_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_my_organization_id());

CREATE POLICY lead_scores_update_member
  ON public.lead_scores
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_my_organization_id())
  WITH CHECK (organization_id = public.get_my_organization_id());

CREATE POLICY lead_scores_delete_admin
  ON public.lead_scores
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY follow_ups_select_member
  ON public.follow_ups
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY follow_ups_insert_member
  ON public.follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND created_by = auth.uid()
  );

CREATE POLICY follow_ups_update_member
  ON public.follow_ups
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND (
      public.is_org_admin_or_owner()
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND (
      public.is_org_admin_or_owner()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY follow_ups_delete_admin
  ON public.follow_ups
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY ai_generation_logs_select_member
  ON public.ai_generation_logs
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY ai_generation_logs_insert_member
  ON public.ai_generation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND user_id = auth.uid()
  );

CREATE POLICY ai_generation_logs_update_admin
  ON public.ai_generation_logs
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY ai_generation_logs_delete_admin
  ON public.ai_generation_logs
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY campaigns_select_member
  ON public.campaigns
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY campaigns_insert_admin
  ON public.campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
    AND created_by = auth.uid()
  );

CREATE POLICY campaigns_update_admin
  ON public.campaigns
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY campaigns_delete_admin
  ON public.campaigns
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY campaign_leads_select_member
  ON public.campaign_leads
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY campaign_leads_insert_admin
  ON public.campaign_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY campaign_leads_update_admin
  ON public.campaign_leads
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY campaign_leads_delete_admin
  ON public.campaign_leads
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY content_items_select_member
  ON public.content_items
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY content_items_insert_admin
  ON public.content_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
    AND created_by = auth.uid()
  );

CREATE POLICY content_items_update_admin
  ON public.content_items
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY content_items_delete_admin
  ON public.content_items
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY sales_scripts_select_member
  ON public.sales_scripts
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY sales_scripts_insert_admin
  ON public.sales_scripts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY sales_scripts_update_admin
  ON public.sales_scripts
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY sales_scripts_delete_admin
  ON public.sales_scripts
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY imports_select_member
  ON public.imports
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY imports_insert_member
  ON public.imports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND uploaded_by = auth.uid()
  );

CREATE POLICY imports_update_admin
  ON public.imports
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY imports_delete_admin
  ON public.imports
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY dashboard_snapshots_select_member
  ON public.dashboard_snapshots
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY dashboard_snapshots_insert_admin
  ON public.dashboard_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY dashboard_snapshots_update_admin
  ON public.dashboard_snapshots
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY dashboard_snapshots_delete_admin
  ON public.dashboard_snapshots
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_label text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);

create index audit_logs_org_entity_type_idx
  on public.audit_logs (organization_id, entity_type, created_at desc);

create index audit_logs_org_action_idx
  on public.audit_logs (organization_id, action, created_at desc);

create index audit_logs_org_actor_idx
  on public.audit_logs (organization_id, actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy audit_logs_insert_org_member
on public.audit_logs
for insert
with check (organization_id = public.get_my_organization_id());

create policy audit_logs_select_admin_owner
on public.audit_logs
for select
using (
  organization_id = public.get_my_organization_id()
  and public.is_org_admin_or_owner()
);

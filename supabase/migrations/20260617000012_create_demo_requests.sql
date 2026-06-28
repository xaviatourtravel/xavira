-- Public marketing demo request capture (desklabs.id/demo)

create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  full_name text not null,
  work_email text not null,
  company_name text not null,
  phone text not null,
  industry text not null,
  company_size text,
  main_challenge text,
  message text,
  status text not null default 'new',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_requests_status_check check (
    status in ('new', 'contacted', 'scheduled', 'completed', 'spam', 'archived')
  )
);

create index demo_requests_created_at_idx
  on public.demo_requests (created_at desc);

create index demo_requests_work_email_idx
  on public.demo_requests (work_email);

create index demo_requests_organization_id_idx
  on public.demo_requests (organization_id)
  where organization_id is not null;

create index demo_requests_status_idx
  on public.demo_requests (status, created_at desc);

create trigger demo_requests_updated_at
  before update on public.demo_requests
  for each row execute function public.handle_updated_at();

alter table public.demo_requests enable row level security;

-- Inserts and reads are performed via service role in server actions.
-- Authenticated org members can read demo requests linked to their organization.
create policy demo_requests_select_org_member
on public.demo_requests
for select
using (
  organization_id is not null
  and organization_id = public.get_my_organization_id()
);

create policy demo_requests_update_org_admin
on public.demo_requests
for update
using (
  organization_id is not null
  and organization_id = public.get_my_organization_id()
  and public.is_org_admin_or_owner()
)
with check (
  organization_id is not null
  and organization_id = public.get_my_organization_id()
  and public.is_org_admin_or_owner()
);

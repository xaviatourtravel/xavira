-- Public marketing contact form messages (desklabs.id/contact)

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  full_name text not null,
  email text not null,
  company_name text,
  topic text not null,
  message text not null,
  status text not null default 'new',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_status_check check (
    status in ('new', 'read', 'replied', 'spam', 'archived')
  )
);

create index contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index contact_messages_email_idx
  on public.contact_messages (email);

create index contact_messages_topic_idx
  on public.contact_messages (topic, created_at desc);

create index contact_messages_organization_id_idx
  on public.contact_messages (organization_id)
  where organization_id is not null;

create trigger contact_messages_updated_at
  before update on public.contact_messages
  for each row execute function public.handle_updated_at();

alter table public.contact_messages enable row level security;

create policy contact_messages_select_org_member
on public.contact_messages
for select
using (
  organization_id is not null
  and organization_id = public.get_my_organization_id()
);

create policy contact_messages_update_org_admin
on public.contact_messages
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

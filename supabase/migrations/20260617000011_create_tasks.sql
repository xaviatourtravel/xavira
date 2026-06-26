-- Task Engine: organization-scoped operational tasks (RFC-0002)

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid references public.leads (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  payment_id uuid references public.booking_payments (id) on delete set null,
  participant_id uuid references public.booking_participants (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null,
  description text,
  task_type text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_status_check check (
    status in ('open', 'in_progress', 'completed', 'skipped', 'overdue')
  ),
  constraint tasks_priority_check check (
    priority in ('low', 'normal', 'high', 'urgent')
  )
);

create index tasks_organization_id_idx
  on public.tasks (organization_id);

create index tasks_assigned_to_idx
  on public.tasks (assigned_to)
  where assigned_to is not null;

create index tasks_status_idx
  on public.tasks (organization_id, status);

create index tasks_due_at_idx
  on public.tasks (organization_id, due_at)
  where due_at is not null;

create index tasks_task_type_idx
  on public.tasks (organization_id, task_type);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

alter table public.tasks enable row level security;

create policy tasks_select_org
on public.tasks
for select
using (organization_id = public.get_my_organization_id());

create policy tasks_insert_org
on public.tasks
for insert
with check (organization_id = public.get_my_organization_id());

create policy tasks_update_org
on public.tasks
for update
using (organization_id = public.get_my_organization_id())
with check (organization_id = public.get_my_organization_id());

create policy tasks_delete_admin
on public.tasks
for delete
using (
  organization_id = public.get_my_organization_id()
  and public.is_org_admin_or_owner()
);

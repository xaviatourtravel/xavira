create table if not exists public.ai_meeting_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brain_id text not null check (brain_id in ('desklabs', 'kreatifpedia', 'piatur', 'founder')),
  title text not null default 'Untitled meeting',
  transcript jsonb not null default '[]'::jsonb,
  insight jsonb,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_meeting_memories (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_meeting_sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brain_id text not null check (brain_id in ('desklabs', 'kreatifpedia', 'piatur', 'founder')),
  content text not null,
  approved_by uuid not null references auth.users(id),
  approved_at timestamptz not null default now()
);
alter table public.ai_meeting_sessions enable row level security;
alter table public.ai_meeting_memories enable row level security;
create policy "Workspace members manage AI meeting sessions" on public.ai_meeting_sessions for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));
create policy "Workspace members manage approved meeting memories" on public.ai_meeting_memories for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));
create index if not exists ai_meeting_sessions_org_brain_idx on public.ai_meeting_sessions (organization_id, brain_id, created_at desc);
create index if not exists ai_meeting_memories_org_brain_idx on public.ai_meeting_memories (organization_id, brain_id, approved_at desc);

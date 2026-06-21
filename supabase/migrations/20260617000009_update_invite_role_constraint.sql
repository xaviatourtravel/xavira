alter table public.organization_invites
  drop constraint if exists organization_invites_role_not_owner;

alter table public.organization_invites
  add constraint organization_invites_role_not_owner
  check (
    role in (
      'admin',
      'agent',
      'sales',
      'marketing',
      'finance'
    )
  );
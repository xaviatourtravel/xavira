create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,

  booking_code text,
  customer_name text not null,
  package_name text,
  departure_date date,

  total_pax integer not null default 1,
  total_amount numeric not null default 0,

  payment_status text not null default 'pending',
  booking_status text not null default 'new',

  notes text,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_participants (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  full_name text not null,
  phone text,
  passport_number text,
  passport_photo_url text,
  address text,
  emergency_contact text,
  notes text,

  created_at timestamptz not null default now()
);

create table public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  payment_type text not null,
  amount numeric not null default 0,
  payment_date date,
  proof_url text,
  notes text,

  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.booking_participants enable row level security;
alter table public.booking_payments enable row level security;

create policy "bookings select own organization"
on public.bookings
for select
using (organization_id = public.get_my_organization_id());

create policy "bookings insert own organization"
on public.bookings
for insert
with check (organization_id = public.get_my_organization_id());

create policy "bookings update own organization"
on public.bookings
for update
using (organization_id = public.get_my_organization_id());

create policy "booking participants select own organization"
on public.booking_participants
for select
using (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_participants.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);

create policy "booking participants insert own organization"
on public.booking_participants
for insert
with check (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_participants.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);

create policy "booking participants update own organization"
on public.booking_participants
for update
using (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_participants.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);

create policy "booking payments select own organization"
on public.booking_payments
for select
using (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_payments.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);

create policy "booking payments insert own organization"
on public.booking_payments
for insert
with check (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_payments.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);

create policy "booking payments update own organization"
on public.booking_payments
for update
using (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_payments.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);
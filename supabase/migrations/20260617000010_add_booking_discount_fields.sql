alter table public.bookings
  add column if not exists subtotal_amount numeric not null default 0,
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists discount_note text;

update public.bookings
set
  subtotal_amount = total_amount,
  discount_amount = 0
where subtotal_amount = 0
  and discount_amount = 0;

alter table public.booking_payments
  add column if not exists payment_method text,
  add column if not exists reference_number text;

alter table public.bookings
  alter column payment_status set default 'unpaid';

update public.bookings
set payment_status = case payment_status
  when 'pending' then 'unpaid'
  when 'partial_paid' then 'dp_paid'
  when 'paid' then 'fully_paid'
  else payment_status
end
where payment_status in ('pending', 'partial_paid', 'paid');

do $$
declare
  booking_row record;
  total_payments numeric;
begin
  for booking_row in
    select id, total_amount from public.bookings
  loop
    select coalesce(sum(amount), 0)
    into total_payments
    from public.booking_payments
    where booking_id = booking_row.id;

    if total_payments = 0 then
      update public.bookings
      set payment_status = 'unpaid'
      where id = booking_row.id;
    elsif total_payments > booking_row.total_amount then
      update public.bookings
      set payment_status = 'overpaid'
      where id = booking_row.id;
    elsif total_payments >= booking_row.total_amount then
      update public.bookings
      set payment_status = 'fully_paid'
      where id = booking_row.id;
    else
      update public.bookings
      set payment_status = 'dp_paid'
      where id = booking_row.id;
    end if;
  end loop;
end $$;

create policy "booking payments delete own organization"
on public.booking_payments
for delete
using (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_payments.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);

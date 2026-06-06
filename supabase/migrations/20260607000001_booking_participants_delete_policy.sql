create policy "booking participants delete own organization"
on public.booking_participants
for delete
using (
  exists (
    select 1 from public.bookings
    where bookings.id = booking_participants.booking_id
    and bookings.organization_id = public.get_my_organization_id()
  )
);

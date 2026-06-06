create policy "bookings delete own organization"
on public.bookings
for delete
using (organization_id = public.get_my_organization_id());

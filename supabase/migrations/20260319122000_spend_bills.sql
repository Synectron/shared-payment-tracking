alter table public.expenses add column if not exists bill_path text;
alter table public.expenses add column if not exists created_by uuid references public.profiles(id);
update public.expenses set created_by = paid_by_id where created_by is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bills', 'bills', true, 10485760, array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update set public = excluded.public;

drop policy if exists bills_select on storage.objects;
drop policy if exists bills_insert on storage.objects;
drop policy if exists bills_update on storage.objects;
drop policy if exists bills_delete on storage.objects;

create policy bills_select on storage.objects for select to authenticated
  using (bucket_id = 'bills');
create policy bills_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'bills');
create policy bills_update on storage.objects for update to authenticated
  using (bucket_id = 'bills');
create policy bills_delete on storage.objects for delete to authenticated
  using (bucket_id = 'bills');

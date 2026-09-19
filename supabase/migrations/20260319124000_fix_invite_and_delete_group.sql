-- pgcrypto lives in the extensions schema on Supabase.
-- Functions with search_path=public cannot see gen_random_bytes unqualified.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.regenerate_invite_code(gid uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_code text;
begin
  if auth.uid() is null or not public.is_group_member(gid) then
    raise exception 'Not allowed';
  end if;

  new_code := lower(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
  update public.groups set invite_code = new_code where id = gid;
  return new_code;
end;
$$;

revoke all on function public.regenerate_invite_code(uuid) from public;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;

alter table public.groups
  alter column invite_code set default lower(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));

-- Owner (or creator) can delete a group. Ordered deletes avoid FK RESTRICT
-- between expenses.source_id and payment_sources.
create or replace function public.delete_group(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.groups g
    where g.id = gid
      and (
        g.created_by = auth.uid()
        or exists (
          select 1
          from public.group_members m
          where m.group_id = g.id
            and m.user_id = auth.uid()
            and m.role = 'owner'
        )
      )
  ) then
    raise exception 'Not allowed';
  end if;

  -- Break expense → payment_sources RESTRICT before cascading group delete
  delete from public.expenses where group_id = gid;
  delete from public.payment_sources where group_id = gid;
  delete from public.group_members where group_id = gid;
  delete from public.groups where id = gid;
end;
$$;

revoke all on function public.delete_group(uuid) from public;
grant execute on function public.delete_group(uuid) to authenticated;

drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups for delete to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.group_members m
      where m.group_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

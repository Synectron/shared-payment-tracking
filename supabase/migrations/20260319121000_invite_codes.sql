-- Invite links via group invite_code (no email invites)
create extension if not exists pgcrypto with schema extensions;

alter table public.groups
  add column if not exists invite_code text;

update public.groups
set invite_code = lower(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8))
where invite_code is null;

alter table public.groups
  alter column invite_code set not null;

alter table public.groups
  alter column invite_code set default lower(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));

create unique index if not exists groups_invite_code_idx on public.groups (invite_code);

create or replace function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select id into gid
  from public.groups
  where lower(invite_code) = lower(trim(code))
  limit 1;

  if gid is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (gid, uid, 'member')
  on conflict do nothing;

  return gid;
end;
$$;

revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;

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

drop table if exists public.invites cascade;

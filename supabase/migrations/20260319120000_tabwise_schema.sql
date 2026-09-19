-- Tabwise schema
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  color text not null default '#0f766e',
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  unique (group_id, email)
);

create table if not exists public.payment_sources (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('card', 'upi', 'utility')),
  owner_id uuid references public.profiles (id) on delete set null,
  last4 text,
  provider text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  amount_cents integer not null check (amount_cents > 0),
  date date not null,
  due_date date not null,
  paid_by_id uuid not null references public.profiles (id) on delete restrict,
  used_by_id uuid not null references public.profiles (id) on delete restrict,
  source_id uuid not null references public.payment_sources (id) on delete restrict,
  charged_to_source_id uuid references public.payment_sources (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  person_id uuid not null references public.profiles (id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'pending', 'paid')),
  paid_at date,
  repaid_with text check (repaid_with is null or repaid_with in ('upi', 'card', 'bank', 'cash', 'paid-the-card', 'other')),
  unique (expense_id, person_id)
);

create table if not exists public.payment_claims (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.shares (id) on delete cascade,
  claimed_by uuid not null references public.profiles (id) on delete cascade,
  method text not null check (method in ('upi', 'card', 'bank', 'cash', 'paid-the-card', 'other')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists invites_token_idx on public.invites (token);
create index if not exists invites_email_idx on public.invites (email);
create index if not exists payment_sources_group_id_idx on public.payment_sources (group_id);
create index if not exists expenses_group_id_idx on public.expenses (group_id);
create index if not exists shares_expense_id_idx on public.shares (expense_id);
create index if not exists payment_claims_share_id_idx on public.payment_claims (share_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, color)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'friend'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'color', '#0f766e')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.add_group_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.add_group_owner();

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invites enable row level security;
alter table public.payment_sources enable row level security;
alter table public.expenses enable row level security;
alter table public.shares enable row level security;
alter table public.payment_claims enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.group_members me
      join public.group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy groups_select on public.groups for select to authenticated
  using (public.is_group_member(id) or created_by = auth.uid());
create policy groups_insert on public.groups for insert to authenticated
  with check (created_by = auth.uid());
create policy groups_update on public.groups for update to authenticated
  using (public.is_group_member(id) and exists (
    select 1 from public.group_members m where m.group_id = id and m.user_id = auth.uid() and m.role = 'owner'
  ));

create policy members_select on public.group_members for select to authenticated
  using (public.is_group_member(group_id));
create policy members_insert on public.group_members for insert to authenticated
  with check ((user_id = auth.uid()) or public.is_group_member(group_id));
create policy members_delete on public.group_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members m
      where m.group_id = group_members.group_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy invites_select on public.invites for select to authenticated
  using (
    public.is_group_member(group_id)
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
create policy invites_insert on public.invites for insert to authenticated
  with check (public.is_group_member(group_id) and invited_by = auth.uid());
create policy invites_update on public.invites for update to authenticated
  using (
    public.is_group_member(group_id)
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

create policy sources_select on public.payment_sources for select to authenticated
  using (public.is_group_member(group_id));
create policy sources_insert on public.payment_sources for insert to authenticated
  with check (public.is_group_member(group_id));
create policy sources_update on public.payment_sources for update to authenticated
  using (public.is_group_member(group_id));
create policy sources_delete on public.payment_sources for delete to authenticated
  using (public.is_group_member(group_id));

create policy expenses_select on public.expenses for select to authenticated
  using (public.is_group_member(group_id));
create policy expenses_insert on public.expenses for insert to authenticated
  with check (public.is_group_member(group_id));
create policy expenses_update on public.expenses for update to authenticated
  using (public.is_group_member(group_id));
create policy expenses_delete on public.expenses for delete to authenticated
  using (public.is_group_member(group_id));

create policy shares_select on public.shares for select to authenticated
  using (exists (
    select 1 from public.expenses e where e.id = expense_id and public.is_group_member(e.group_id)
  ));
create policy shares_insert on public.shares for insert to authenticated
  with check (exists (
    select 1 from public.expenses e where e.id = expense_id and public.is_group_member(e.group_id)
  ));
create policy shares_update on public.shares for update to authenticated
  using (exists (
    select 1 from public.expenses e where e.id = expense_id and public.is_group_member(e.group_id)
  ));

create policy claims_select on public.payment_claims for select to authenticated
  using (exists (
    select 1 from public.shares s
    join public.expenses e on e.id = s.expense_id
    where s.id = share_id and public.is_group_member(e.group_id)
  ));
create policy claims_insert on public.payment_claims for insert to authenticated
  with check (
    claimed_by = auth.uid()
    and exists (
      select 1 from public.shares s
      join public.expenses e on e.id = s.expense_id
      where s.id = share_id and public.is_group_member(e.group_id)
    )
  );
create policy claims_update on public.payment_claims for update to authenticated
  using (exists (
    select 1 from public.shares s
    join public.expenses e on e.id = s.expense_id
    where s.id = share_id and public.is_group_member(e.group_id)
      and (e.paid_by_id = auth.uid() or claimed_by = auth.uid())
  ));

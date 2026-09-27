-- The monthly tab moves from a group setting to a per-spend choice.
-- Each group has one monthly tab: the spends flagged on_tab.
alter table public.expenses
  add column if not exists on_tab boolean not null default false;

update public.expenses e
  set on_tab = true
  from public.groups g
  where e.group_id = g.id and g.tracking_mode = 'monthly_tab';

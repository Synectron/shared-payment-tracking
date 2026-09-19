-- Monthly tab vs standard shared-group mode
alter table public.groups
  add column if not exists tracking_mode text not null default 'standard';

alter table public.groups
  drop constraint if exists groups_tracking_mode_check;

alter table public.groups
  add constraint groups_tracking_mode_check
  check (tracking_mode in ('standard', 'monthly_tab'));

comment on column public.groups.tracking_mode is
  'standard = per-spend splits (equal/open); monthly_tab = running month account, equal-split spends, clear at month end';

-- Run only after the app build that reads bill_paths / on_tab is live;
-- older builds still write bill_path and read groups.tracking_mode.
update public.expenses
  set bill_paths = array[bill_path]
  where bill_path is not null and cardinality(bill_paths) = 0;

alter table public.expenses drop column if exists bill_path;

alter table public.groups drop constraint if exists groups_tracking_mode_check;
alter table public.groups drop column if exists tracking_mode;

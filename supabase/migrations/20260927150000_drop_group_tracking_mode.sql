-- Run only after the build with spend-level monthly tabs (on_tab) is live;
-- earlier builds still read groups.tracking_mode.
alter table public.groups drop constraint if exists groups_tracking_mode_check;
alter table public.groups drop column if exists tracking_mode;

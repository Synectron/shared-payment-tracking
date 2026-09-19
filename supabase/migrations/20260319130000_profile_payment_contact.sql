-- Payment contact on profiles (visible to co-members via existing profiles_select RLS)
alter table public.profiles
  add column if not exists upi_id text,
  add column if not exists phone text;

comment on column public.profiles.upi_id is 'Member UPI ID for settlements; readable by shared group members';
comment on column public.profiles.phone is 'Member phone for settlements; readable by shared group members';

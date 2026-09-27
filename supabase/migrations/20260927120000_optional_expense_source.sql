-- Spends no longer ask which card / UPI / utility paid them
alter table public.expenses
  alter column source_id drop not null;

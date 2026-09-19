alter table public.groups
  add column if not exists currency text not null default 'INR';

alter table public.groups
  drop constraint if exists groups_currency_check;

alter table public.groups
  add constraint groups_currency_check
  check (currency in ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'));

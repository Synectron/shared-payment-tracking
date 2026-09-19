-- Open / self-serve share amounts: members declare their own share; owner/creator approves.

alter table public.expenses
  add column if not exists share_mode text not null default 'assigned';

alter table public.expenses
  drop constraint if exists expenses_share_mode_check;

alter table public.expenses
  add constraint expenses_share_mode_check
  check (share_mode in ('assigned', 'open'));

-- Extend share statuses: open (awaiting declaration), amount_pending (declared, not final yet)
alter table public.shares drop constraint if exists shares_status_check;

alter table public.shares
  add constraint shares_status_check
  check (status in ('unpaid', 'pending', 'paid', 'open', 'amount_pending'));

comment on column public.expenses.share_mode is
  'assigned = equal split upfront; open = members declare own amounts for approval';

comment on constraint shares_status_check on public.shares is
  'open/amount_pending are pre-settlement; unpaid/pending/paid follow payment claim flow';

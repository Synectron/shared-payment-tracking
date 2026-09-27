-- A spend can carry several bill / receipt files
alter table public.expenses
  add column if not exists bill_paths text[] not null default '{}';

update public.expenses
  set bill_paths = array[bill_path]
  where bill_path is not null and cardinality(bill_paths) = 0;

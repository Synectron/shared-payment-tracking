-- Builds from d60b7f5 onward read and write bill_paths only
update public.expenses
  set bill_paths = array[bill_path]
  where bill_path is not null and cardinality(bill_paths) = 0;

alter table public.expenses drop column if exists bill_path;

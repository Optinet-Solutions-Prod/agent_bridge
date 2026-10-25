-- ============================================================================
-- Ponte — indexes for sorting the holiday-rental table (~112k rows)
--
-- The table sorts by a column, nulls last, then by register number (newest
-- first). Without these, sorting by name or municipality scans and sorts the
-- whole table (~1.2s); with them each page is an index walk (milliseconds).
-- Each sortable column gets one index per direction because "nulls last"
-- can't be read backwards. Run once in the Supabase SQL editor.
-- ============================================================================

create index if not exists register_rentals_sort_name_asc       on public.register_rentals (name asc nulls last, nr_num desc);
create index if not exists register_rentals_sort_name_desc      on public.register_rentals (name desc nulls last, nr_num desc);
create index if not exists register_rentals_sort_muni_asc       on public.register_rentals (municipality asc nulls last, nr_num desc);
create index if not exists register_rentals_sort_muni_desc      on public.register_rentals (municipality desc nulls last, nr_num desc);
create index if not exists register_rentals_sort_role_asc       on public.register_rentals (operator_role asc nulls last, nr_num desc);
create index if not exists register_rentals_sort_role_desc      on public.register_rentals (operator_role desc nulls last, nr_num desc);
create index if not exists register_rentals_sort_guests_desc    on public.register_rentals (guests desc nulls last, nr_num desc);
create index if not exists register_rentals_sort_guests_asc     on public.register_rentals (guests asc nulls last, nr_num desc);
create index if not exists register_rentals_sort_opened_desc    on public.register_rentals (opened_on desc nulls last, nr_num desc);
create index if not exists register_rentals_sort_opened_asc     on public.register_rentals (opened_on asc nulls last, nr_num desc);
create index if not exists register_rentals_district_nr         on public.register_rentals (district, nr_num desc);

analyze public.register_rentals;

-- Sanity check: should list 11 indexes.
select indexname from pg_indexes where tablename = 'register_rentals' and indexname like 'register_rentals_sort_%' or indexname = 'register_rentals_district_nr';

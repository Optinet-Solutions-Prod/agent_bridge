-- ============================================================================
-- AgentBridge — Portugal launch
--
-- Anonymous agent handles now read "Agent #PT…" instead of "#MT…". Existing
-- codes keep their digits so nothing an agent has shared changes except the
-- prefix. New sign-ups get PT codes from the generator.
--
-- Safe to run more than once.
-- ============================================================================

create or replace function public.generate_anon_code()
returns text language plpgsql as $$
declare
  code text;
begin
  loop
    code := 'PT' || lpad(floor(random() * 100000)::int::text, 5, '0');
    exit when not exists (select 1 from public.agents where anon_code = code);
  end loop;
  return code;
end $$;

update public.agents a
   set anon_code = 'PT' || substr(a.anon_code, 3)
 where a.anon_code like 'MT%'
   and not exists (select 1 from public.agents b where b.anon_code = 'PT' || substr(a.anon_code, 3));

-- Prove it: this should start with PT.
select public.generate_anon_code() as sample_new_code;

-- ============================================================================
-- AgentBridge — Portugal launch
--
-- Anonymous agent handles now read "Agent #PT…" instead of "#MT…". Existing
-- codes keep their digits so nothing an agent has shared changes except the
-- prefix. New sign-ups get PT codes from the generator.
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

update public.agents
   set anon_code = 'PT' || substr(anon_code, 3)
 where anon_code like 'MT%'
   and not exists (select 1 from public.agents a2 where a2.anon_code = 'PT' || substr(public.agents.anon_code, 3));

alter table public.resellers alter column commission_pct set default 20;

create table public.sale_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  reseller_id uuid not null,
  note text,
  used_by uuid,
  used_by_name text,
  salon_id uuid references public.salons(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert on public.sale_codes to authenticated;
grant all on public.sale_codes to service_role;
alter table public.sale_codes enable row level security;
create policy "codes reseller read" on public.sale_codes for select to authenticated using (reseller_id = auth.uid() or used_by = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "codes reseller insert" on public.sale_codes for insert to authenticated with check (reseller_id = auth.uid() and used_by is null and public.has_role(auth.uid(),'revendedor'));

create or replace function public.redeem_sale_code(_code text)
returns text language plpgsql security definer set search_path = public
as $$
declare
  _c public.sale_codes;
  _salon public.salons;
  _name text;
begin
  if auth.uid() is null then return 'Faça login para validar o código.'; end if;
  select * into _c from public.sale_codes where code = upper(trim(_code)) for update;
  if not found then return 'Código inválido.'; end if;
  if _c.used_by is not null then
    if _c.used_by = auth.uid() then return 'OK'; end if;
    return 'Este código já foi utilizado.';
  end if;
  if _c.reseller_id = auth.uid() then return 'Você não pode usar o próprio código.'; end if;
  select * into _salon from public.salons where owner_id = auth.uid() limit 1;
  select coalesce(nullif(full_name,''), email) into _name from public.profiles where id = auth.uid();
  update public.sale_codes set used_by = auth.uid(), used_by_name = _name, salon_id = _salon.id, used_at = now() where id = _c.id;
  if _salon.id is not null then
    update public.salons set reseller_id = _c.reseller_id where id = _salon.id;
  end if;
  return 'OK';
end $$;
grant execute on function public.redeem_sale_code(text) to authenticated;
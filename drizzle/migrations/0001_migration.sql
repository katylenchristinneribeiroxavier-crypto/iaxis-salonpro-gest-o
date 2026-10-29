alter table public.plans add column annual_monthly_price numeric(10,2) not null default 0;

create table public.platform_settings (
  id int primary key default 1 check (id = 1),
  pix_key text not null default '',
  pix_holder text not null default '',
  pix_bank text not null default '',
  pix_cnpj text not null default ''
);
grant select on public.platform_settings to anon, authenticated;
grant update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "settings public" on public.platform_settings for select to anon, authenticated using (true);
create policy "settings admin" on public.platform_settings for update to authenticated using (public.has_role(auth.uid(),'super_admin'));
insert into public.platform_settings (id) values (1);

create table public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text not null,
  phone text,
  plan_id uuid references public.plans(id),
  billing text not null default 'mensal',
  amount numeric(10,2) not null,
  status text not null default 'aguardando',
  created_at timestamptz not null default now()
);
grant insert on public.subscription_requests to anon, authenticated;
grant select, update on public.subscription_requests to authenticated;
grant all on public.subscription_requests to service_role;
alter table public.subscription_requests enable row level security;
create policy "anyone request" on public.subscription_requests for insert to anon, authenticated with check (status = 'aguardando');
create policy "admin read req" on public.subscription_requests for select to authenticated using (public.has_role(auth.uid(),'super_admin'));
create policy "admin upd req" on public.subscription_requests for update to authenticated using (public.has_role(auth.uid(),'super_admin'));
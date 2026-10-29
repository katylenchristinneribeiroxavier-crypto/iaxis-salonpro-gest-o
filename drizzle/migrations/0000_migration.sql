create type public.app_role as enum ('super_admin','revendedor','dono_salao','cliente');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  online_fee_pct numeric(5,2) not null default 2,
  sort int not null default 0
);
grant select on public.plans to anon, authenticated;
grant all on public.plans to service_role;
grant insert, update, delete on public.plans to authenticated;
alter table public.plans enable row level security;
create policy "plans public" on public.plans for select to anon, authenticated using (true);
create policy "plans admin" on public.plans for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
insert into public.plans (name, price, sort) values ('Básico',97,1),('Pro',197,2),('Premium',297,3);

create table public.resellers (
  user_id uuid primary key,
  code text not null unique,
  commission_pct numeric(5,2) not null default 30,
  pix_key text,
  created_at timestamptz not null default now()
);
grant select, update on public.resellers to authenticated;
grant all on public.resellers to service_role;
alter table public.resellers enable row level security;
create policy "reseller own" on public.resellers for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "reseller admin update" on public.resellers for update to authenticated using (public.has_role(auth.uid(),'super_admin'));

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  slug text not null unique,
  city text,
  plan_id uuid references public.plans(id),
  status text not null default 'ativo',
  reseller_id uuid,
  brand_color text not null default '#C9A24B',
  created_at timestamptz not null default now()
);
grant select on public.salons to anon, authenticated;
grant update on public.salons to authenticated;
grant all on public.salons to service_role;
alter table public.salons enable row level security;
create policy "salons public active" on public.salons for select to anon, authenticated using (status = 'ativo');
create policy "salons owner" on public.salons for select to authenticated using (owner_id = auth.uid());
create policy "salons reseller" on public.salons for select to authenticated using (reseller_id = auth.uid());
create policy "salons admin" on public.salons for select to authenticated using (public.has_role(auth.uid(),'super_admin'));
create policy "salons admin update" on public.salons for update to authenticated using (public.has_role(auth.uid(),'super_admin'));

create or replace function public.owns_salon(_salon uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.salons where id = _salon and owner_id = auth.uid()) $$;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  duration_min int not null default 60
);
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  commission_pct numeric(5,2) not null default 50
);
grant select on public.services, public.professionals to anon, authenticated;
grant insert, update, delete on public.services, public.professionals to authenticated;
grant all on public.services, public.professionals to service_role;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
create policy "services public" on public.services for select to anon, authenticated using (true);
create policy "services owner" on public.services for all to authenticated using (public.owns_salon(salon_id)) with check (public.owns_salon(salon_id));
create policy "pros public" on public.professionals for select to anon, authenticated using (true);
create policy "pros owner" on public.professionals for all to authenticated using (public.owns_salon(salon_id)) with check (public.owns_salon(salon_id));

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  client_id uuid,
  client_name text not null,
  service_id uuid references public.services(id) on delete set null,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  starts_at timestamptz not null,
  status text not null default 'confirmado',
  price numeric(10,2) not null default 0,
  deposit numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create unique index appointments_no_clash on public.appointments (professional_id, starts_at) where status <> 'cancelado';
grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create policy "appt owner" on public.appointments for all to authenticated using (public.owns_salon(salon_id)) with check (public.owns_salon(salon_id));
create policy "appt client read" on public.appointments for select to authenticated using (client_id = auth.uid());
create policy "appt client insert" on public.appointments for insert to authenticated with check (client_id = auth.uid() and status = 'confirmado');
create policy "appt admin read" on public.appointments for select to authenticated using (public.has_role(auth.uid(),'super_admin'));

create or replace function public.booked_slots(_professional uuid, _day date)
returns setof timestamptz language sql stable security definer set search_path = public
as $$ select starts_at from public.appointments where professional_id = _professional and status <> 'cancelado' and starts_at::date = _day $$;
grant execute on function public.booked_slots(uuid, date) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  _role text := coalesce(new.raw_user_meta_data->>'role','cliente');
  _name text := coalesce(new.raw_user_meta_data->>'full_name','');
  _ref text := new.raw_user_meta_data->>'ref';
  _reseller uuid;
  _salon uuid;
  _slug text;
begin
  insert into public.profiles (id, full_name, email) values (new.id, _name, new.email);
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;
  if _role not in ('revendedor','dono_salao','cliente') then _role := 'cliente'; end if;
  insert into public.user_roles (user_id, role) values (new.id, _role::app_role) on conflict do nothing;

  if _role = 'revendedor' then
    _slug := lower(regexp_replace(coalesce(nullif(_name,''), split_part(new.email,'@',1)), '[^a-zA-Z0-9]', '', 'g'));
    if exists (select 1 from public.resellers where code = _slug) then _slug := _slug || substr(new.id::text,1,4); end if;
    insert into public.resellers (user_id, code) values (new.id, _slug);
  elsif _role = 'dono_salao' then
    if _ref is not null then select user_id into _reseller from public.resellers where code = lower(_ref); end if;
    _slug := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'salon_name',''), 'salao'), '[^a-zA-Z0-9]+', '-', 'g'));
    _slug := trim(both '-' from _slug) || '-' || substr(new.id::text,1,4);
    insert into public.salons (owner_id, name, slug, city, plan_id, reseller_id)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'salon_name',''),'Meu Salão'), _slug,
            new.raw_user_meta_data->>'city', (select id from public.plans where name='Pro'), _reseller)
    returning id into _salon;
    insert into public.services (salon_id, name, price, duration_min) values
      (_salon,'Corte',90,60),(_salon,'Escova',60,45),(_salon,'Luzes',380,180),(_salon,'Manicure',45,45),(_salon,'Progressiva',290,150);
    insert into public.professionals (salon_id, name) values (_salon,'Carla'),(_salon,'Paula'),(_salon,'Rita');
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
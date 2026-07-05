-- Sai Bricks — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
--
-- Design rules:
--  * Master tables (leaders, customers, employees, vehicles, suppliers) are never
--    hard-deleted from the app — they carry an `active` flag instead, so history
--    always keeps its references.
--  * Every table carries factory_id: multi-factory ready from day one.
--  * Money-bearing rows snapshot the rate used at entry time (rate columns),
--    so changing a rate later never rewrites history.
--  * Balances, dues and stock are computed in the app, never stored.

create extension if not exists "pgcrypto";

-- ---------- factory + membership ----------

create table factories (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Sai Bricks',
  mfg_rate numeric not null default 0.90,
  batti_rate numeric not null default 0.52,
  default_brick_price numeric not null default 6.50,
  threshold_owed_to_leader numeric not null default 25000,
  threshold_leader_owes numeric not null default 10000,
  created_at timestamptz not null default now()
);

create table profiles (
  user_id uuid not null references auth.users (id) on delete cascade,
  factory_id uuid not null references factories (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  name text,
  created_at timestamptz not null default now(),
  primary key (user_id, factory_id)
);

-- When a signed-in user creates their factory, make them its owner.
create or replace function public.handle_new_factory()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id, factory_id, role) values (auth.uid(), new.id, 'owner');
  return new;
end $$;

create trigger on_factory_created
  after insert on factories
  for each row execute function public.handle_new_factory();

-- Factories the current user belongs to (used by every policy below).
create or replace function public.user_factory_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select factory_id from profiles where user_id = auth.uid();
$$;

create or replace function public.user_is_owner(fid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and factory_id = fid and role = 'owner'
  );
$$;

-- ---------- master data ----------

create table leaders (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  name text not null,
  group_type text not null check (group_type in ('manufacturing', 'batti')),
  people_count int not null default 1,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  name text not null,
  place text not null default '',
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  name text not null,
  designation text not null default '',
  salary numeric not null default 0,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  number text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  name text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- transactions ----------

create table work_entries (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  leader_id uuid not null references leaders (id),
  type text not null check (type in ('manufacturing', 'batti')),
  qty int not null check (qty > 0),
  people_count int not null default 1,
  rate numeric not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table leader_payments (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  leader_id uuid not null references leaders (id),
  kind text not null check (kind in ('advance', 'extra', 'settlement')),
  amount numeric not null check (amount > 0),
  mode text not null check (mode in ('cash', 'upi', 'other')),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  customer_id uuid not null references customers (id),
  place text not null default '',
  qty int not null check (qty > 0),
  rate numeric not null,
  loading_person text,
  loading_cost numeric not null default 0,
  loading_paid boolean not null default true,
  delivered_by_id uuid references employees (id),
  vehicle_id uuid references vehicles (id),
  date_time timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create table sale_payments (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  sale_id uuid not null references sales (id) on delete cascade,
  amount numeric not null check (amount > 0),
  mode text not null check (mode in ('cash', 'upi', 'other')),
  received_by_id uuid references employees (id),
  date date not null,
  created_at timestamptz not null default now()
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  item_name text not null,
  supplier_id uuid references suppliers (id),
  unit text not null default '',
  qty numeric not null check (qty > 0),
  unit_price numeric not null,
  amount_paid numeric not null default 0,
  mode text not null check (mode in ('cash', 'upi', 'other')),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table damage_entries (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  qty int not null check (qty > 0),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table procurements (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  item_name text not null,
  employee_id uuid references employees (id),
  qty numeric,
  total_price numeric not null,
  reason text not null default '',
  date date not null,
  created_at timestamptz not null default now()
);

create table salary_payments (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories (id) on delete cascade,
  employee_id uuid not null references employees (id),
  amount numeric not null check (amount > 0),
  month text not null,
  mode text not null check (mode in ('cash', 'upi', 'other')),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

-- Query-path indexes
create index on work_entries (factory_id, leader_id, date);
create index on leader_payments (factory_id, leader_id, date);
create index on sales (factory_id, customer_id, date_time);
create index on sale_payments (factory_id, sale_id);
create index on purchases (factory_id, date);
create index on procurements (factory_id, date);
create index on salary_payments (factory_id, employee_id);

-- ---------- row-level security ----------

alter table factories enable row level security;
alter table profiles enable row level security;

create policy "members read their factories" on factories
  for select using (id in (select public.user_factory_ids()));
create policy "any signed-in user may create a factory" on factories
  for insert with check (auth.uid() is not null);
create policy "only owners change factory settings" on factories
  for update using (public.user_is_owner(id));

create policy "users read their own memberships" on profiles
  for select using (user_id = auth.uid());

-- Same policy set for every data table.
do $$
declare t text;
begin
  foreach t in array array[
    'leaders','customers','employees','vehicles','suppliers',
    'work_entries','leader_payments','sales','sale_payments',
    'purchases','damage_entries','procurements','salary_payments'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "members full access" on %I for all
         using (factory_id in (select public.user_factory_ids()))
         with check (factory_id in (select public.user_factory_ids()))', t);
  end loop;
end $$;

-- Taskly v2 schema for Supabase (Postgres).
-- Apply in the SQL editor or: supabase db push
-- Balances only change through SECURITY DEFINER RPCs (never from the client).

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'service_status') then
    create type public.service_status as enum ('published', 'in_progress', 'completed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('spend', 'cashout', 'fee', 'earn');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(14, 2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  taskly_price numeric(14, 2) not null check (taskly_price >= 0),
  lat double precision not null,
  lng double precision not null,
  status public.service_status not null default 'published',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references public.profiles (id) on delete set null,
  to_user uuid references public.profiles (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  type public.transaction_type not null,
  created_at timestamptz not null default now()
);

create index if not exists services_status_idx on public.services (status);
create index if not exists services_geo_idx on public.services (lat, lng);
create index if not exists transactions_from_idx on public.transactions (from_user);
create index if not exists transactions_to_idx on public.transactions (to_user);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Haversine distance in kilometers.
create or replace function public.haversine_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select 6371 * acos(
    least(
      1.0,
      greatest(
        -1.0,
        cos(radians(lat1)) * cos(radians(lat2)) *
        cos(radians(lng2) - radians(lng1)) +
        sin(radians(lat1)) * sin(radians(lat2))
      )
    )
  );
$$;

create or replace function public.nearby_services(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 3
)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  taskly_price numeric,
  lat double precision,
  lng double precision,
  status public.service_status,
  distance_km double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.id,
    s.owner_id,
    s.title,
    s.description,
    s.taskly_price,
    s.lat,
    s.lng,
    s.status,
    public.haversine_km(p_lat, p_lng, s.lat, s.lng) as distance_km
  from public.services s
  where s.status = 'published'
    and p_lat is not null
    and p_lng is not null
    and public.haversine_km(p_lat, p_lng, s.lat, s.lng) <= coalesce(p_radius_km, 3)
  order by distance_km asc;
$$;

create or replace function public.spend_taskly(
  p_to_user uuid,
  p_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from uuid := auth.uid();
  v_amount numeric(14, 2);
  v_from_balance numeric(14, 2);
  v_tx uuid;
begin
  if v_from is null then
    raise exception 'not authenticated';
  end if;

  v_amount := round(p_amount, 2);

  if v_amount is null or v_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  if p_to_user is null or p_to_user = v_from then
    raise exception 'invalid recipient';
  end if;

  perform 1
  from public.wallets
  where user_id in (v_from, p_to_user)
  order by user_id
  for update;

  select balance into v_from_balance
  from public.wallets
  where user_id = v_from;

  if v_from_balance is null then
    raise exception 'wallet not found';
  end if;

  if v_from_balance < v_amount then
    raise exception 'insufficient balance';
  end if;

  if not exists (select 1 from public.wallets where user_id = p_to_user) then
    raise exception 'recipient wallet not found';
  end if;

  update public.wallets
  set balance = balance - v_amount
  where user_id = v_from;

  update public.wallets
  set balance = balance + v_amount
  where user_id = p_to_user;

  insert into public.transactions (from_user, to_user, amount, type)
  values (v_from, p_to_user, v_amount, 'spend')
  returning id into v_tx;

  return v_tx;
end;
$$;

-- Debits p_amount from the caller. 15% is recorded as fee; 85% as cashout.
create or replace function public.cashout_taskly(
  p_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_amount numeric(14, 2);
  v_fee numeric(14, 2);
  v_net numeric(14, 2);
  v_balance numeric(14, 2);
  v_tx uuid;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  v_amount := round(p_amount, 2);

  if v_amount is null or v_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  v_fee := round(v_amount * 0.15, 2);
  v_net := v_amount - v_fee;

  if v_net <= 0 then
    raise exception 'amount too small after fee';
  end if;

  select balance into v_balance
  from public.wallets
  where user_id = v_user
  for update;

  if v_balance is null then
    raise exception 'wallet not found';
  end if;

  if v_balance < v_amount then
    raise exception 'insufficient balance';
  end if;

  update public.wallets
  set balance = balance - v_amount
  where user_id = v_user;

  insert into public.transactions (from_user, to_user, amount, type)
  values (v_user, null, v_net, 'cashout')
  returning id into v_tx;

  insert into public.transactions (from_user, to_user, amount, type)
  values (v_user, null, v_fee, 'fee');

  return v_tx;
end;
$$;

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.services enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own"
on public.wallets for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "services_select_published_or_own" on public.services;
create policy "services_select_published_or_own"
on public.services for select
to authenticated
using (status = 'published' or owner_id = auth.uid());

drop policy if exists "services_insert_own" on public.services;
create policy "services_insert_own"
on public.services for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "services_update_own" on public.services;
create policy "services_update_own"
on public.services for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions for select
to authenticated
using (from_user = auth.uid() or to_user = auth.uid());

revoke all on function public.spend_taskly(uuid, numeric) from public;
revoke all on function public.cashout_taskly(numeric) from public;
revoke all on function public.nearby_services(double precision, double precision, double precision) from public;

grant execute on function public.spend_taskly(uuid, numeric) to authenticated;
grant execute on function public.cashout_taskly(numeric) to authenticated;
grant execute on function public.nearby_services(double precision, double precision, double precision) to authenticated;

-- Universo das Barbies: initial commerce schema
-- Apply with the Supabase SQL Editor or Supabase CLI migrations.
-- No demo products are seeded: the catalogue starts empty until the owner adds real stock.

create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'shipped', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  price_aoa integer not null check (price_aoa >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
  customer_phone text not null check (char_length(trim(customer_phone)) between 6 and 30),
  delivery_address text,
  customer_note text,
  status public.order_status not null default 'pending',
  total_aoa integer not null check (total_aoa >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price_aoa integer not null check (unit_price_aoa >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index products_active_category_idx on public.products (is_active, category_id);
create index categories_active_sort_idx on public.categories (is_active, sort_order);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index order_items_order_id_idx on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

-- New accounts are customers by default. Never accept a role from sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- This SECURITY DEFINER helper avoids recursive RLS checks on profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins can update profiles"
on public.profiles for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Anyone can view active categories"
on public.categories for select to anon, authenticated
using (is_active or (select public.is_admin()));

create policy "Admins manage categories"
on public.categories for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Anyone can view active products"
on public.products for select to anon, authenticated
using (is_active or (select public.is_admin()));

create policy "Admins manage products"
on public.products for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Orders are submitted through a server-side transaction below. Direct public
-- inserts are intentionally not allowed, preventing forged totals or missing items.
create policy "Admins manage orders"
on public.orders for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins manage order items"
on public.order_items for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Only authenticated admins can promote a user. Run manually in the SQL Editor:
-- update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';

-- Submit an order atomically: prices and totals are always read from the database,
-- stock is locked and decremented in the same transaction, and item snapshots are saved.
create or replace function public.submit_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_customer_note text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_total bigint := 0;
  v_line record;
  v_product public.products%rowtype;
begin
  if char_length(trim(coalesce(p_customer_name, ''))) not between 2 and 120 then
    raise exception 'Nome inválido.';
  end if;
  if char_length(trim(coalesce(p_customer_phone, ''))) not between 6 and 30 then
    raise exception 'Número de telefone inválido.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'A encomenda deve conter entre 1 e 20 artigos.';
  end if;

  -- Aggregate repeated product IDs so stock cannot be bypassed with duplicate lines.
  for v_line in
    select item.product_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by item.product_id
    order by item.product_id
  loop
    if v_line.product_id is null or v_line.quantity is null or v_line.quantity < 1 then
      raise exception 'Artigo ou quantidade inválida.';
    end if;

    select * into v_product
    from public.products
    where id = v_line.product_id and is_active = true
    for update;

    if not found then
      raise exception 'Um dos artigos já não está disponível.';
    end if;
    if v_product.stock_quantity < v_line.quantity then
      raise exception 'Stock insuficiente para: %.', v_product.name;
    end if;

    v_total := v_total + (v_product.price_aoa::bigint * v_line.quantity);
  end loop;

  if v_total > 2147483647 then
    raise exception 'O valor total da encomenda é demasiado elevado.';
  end if;

  insert into public.orders (
    customer_id, customer_name, customer_phone, delivery_address,
    customer_note, status, total_aoa
  ) values (
    (select auth.uid()), trim(p_customer_name), trim(p_customer_phone),
    nullif(trim(coalesce(p_delivery_address, '')), ''),
    nullif(trim(coalesce(p_customer_note, '')), ''),
    'pending', v_total::integer
  ) returning id into v_order_id;

  for v_line in
    select item.product_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by item.product_id
    order by item.product_id
  loop
    select * into v_product from public.products where id = v_line.product_id;
    insert into public.order_items (
      order_id, product_id, product_name, unit_price_aoa, quantity
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.price_aoa, v_line.quantity
    );
    update public.products
    set stock_quantity = stock_quantity - v_line.quantity
    where id = v_product.id;
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.submit_order(text, text, text, text, jsonb) from public;
grant execute on function public.submit_order(text, text, text, text, jsonb) to anon, authenticated;
revoke insert, update, delete on public.orders from anon;
revoke insert, update, delete on public.order_items from anon;

-- Additive invoice foundation. Existing invoice rows and columns are preserved.
create extension if not exists pgcrypto;

alter table public.invoices
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists invoice_date date default current_date,
  add column if not exists due_date date,
  add column if not exists currency text not null default 'INR',
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists client_id uuid;

create unique index if not exists invoices_client_id_unique
  on public.invoices(client_id)
  where client_id is not null;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null default '',
  owner_name text not null default '',
  phone text,
  address text,
  gstin text,
  upi_id text,
  payment_notes text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  line_total numeric generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_date date not null default current_date,
  method text,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  channel text not null,
  recipient text,
  status text not null,
  external_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payment_events enable row level security;
alter table public.message_logs enable row level security;

create policy "Users manage their profiles" on public.profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage their invoices" on public.invoices
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage their invoice items" on public.invoice_items
  for all to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));

create policy "Users manage their payments" on public.payment_events
  for all to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));

create policy "Users manage their message logs" on public.message_logs
  for all to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));

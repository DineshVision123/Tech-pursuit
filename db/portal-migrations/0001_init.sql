-- Tech Pursuit invoice portal — initial schema.
-- Single-tenant (no client/tenant id anywhere — this database only ever
-- serves Tech Pursuit Systems itself, unlike the original multi-tenant
-- design this was ported from).

create extension if not exists pgcrypto;

-- ---- Auth -------------------------------------------------------------

create table invoice_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  can_delete_invoices boolean not null default false,
  created_at timestamptz not null default now()
);

create table otp_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index otp_requests_email_idx on otp_requests (email, created_at desc);

create table sessions (
  token text primary key,
  member_id uuid not null references invoice_members (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_member_idx on sessions (member_id);

-- ---- Customers ----------------------------------------------------------

create table customers (
  id uuid primary key default gen_random_uuid(),
  title text,
  first_name text,
  middle_name text,
  last_name text,
  suffix text,
  name text not null,
  company text,
  primary_email text not null,
  secondary_email text,
  cc text,
  bcc text,
  phone text,
  mobile text,
  fax text,
  other_contact text,
  website text,
  name_to_print_on_checks text,
  is_sub_customer boolean not null default false,
  parent_customer_id uuid references customers (id) on delete set null,
  billing_address jsonb,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- Bill rates -----------------------------------------------------------

create table bill_rates (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  product text not null,
  rate_cents int not null,
  currency text not null default 'USD',
  effective_from date not null,
  superseded_at date
);
create index bill_rates_customer_idx on bill_rates (customer_id);

-- ---- Invoices -------------------------------------------------------------

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  public_token text not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'rejected', 'submitted', 'paid')),
  customer_id uuid not null references customers (id) on delete restrict,
  invoice_date date not null,
  due_date date not null,
  term text not null,
  custom_term_label text,
  custom_term_days int,
  sales_tax_pct numeric(6, 3) not null default 0,
  payment_instructions text,
  note_to_customer text,
  memo_on_statement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null
);
create index invoices_customer_idx on invoices (customer_id);
create index invoices_status_idx on invoices (status);

create table invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  position int not null default 0,
  product text not null,
  month text,
  description text,
  qty numeric(10, 2) not null default 1,
  rate_cents int,
  bill_rate_id uuid references bill_rates (id) on delete set null,
  amount_cents int not null default 0
);
create index invoice_line_items_invoice_idx on invoice_line_items (invoice_id);

create table invoice_attachments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes int not null,
  bytes bytea not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by text not null
);
create index invoice_attachments_invoice_idx on invoice_attachments (invoice_id);

-- ---- Company profile (singleton) -------------------------------------------

create table company_profile (
  id boolean primary key default true check (id), -- enforces exactly one row
  company_name text not null default '',
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  email text,
  phone text,
  website text,
  bank_name text,
  routing_number text,
  account_number text,
  logo_bytes bytea,
  logo_mime text,
  email_from text,
  updated_at timestamptz not null default now()
);
insert into company_profile (id) values (true);

-- ---- Audit log --------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices (id) on delete set null,
  action text not null,
  actor text not null,
  at timestamptz not null default now(),
  reason text,
  before jsonb,
  after jsonb
);
create index audit_log_invoice_idx on audit_log (invoice_id);
create index audit_log_at_idx on audit_log (at desc);

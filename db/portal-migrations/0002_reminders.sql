-- Payment-reminder tracking — additive migration (0001 already applied).
alter table invoices
  add column if not exists reminder_count int not null default 0,
  add column if not exists last_reminded_at timestamptz;

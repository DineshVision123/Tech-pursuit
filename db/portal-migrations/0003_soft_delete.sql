-- Invoice soft delete + invoice-number reclaim — additive migration.
--
-- deleted_at          set when an invoice is deleted; every read filters on
--                     `deleted_at is null`. Rows are never hard-deleted, so
--                     their audit_log history survives.
-- number_reclaimed_at set alongside deleted_at only when the user chose
--                     "Delete and free up the number" on the top invoice;
--                     nextInvoiceNumber() skips these rows so the number is
--                     handed out again. A deleted-but-not-reclaimed row still
--                     counts, keeping its number reserved forever.
alter table invoices
  add column if not exists deleted_at timestamptz,
  add column if not exists number_reclaimed_at timestamptz;

-- A reclaimed number gets reused by a new invoice while the soft-deleted row
-- still holds it, so uniqueness only applies to numbers that are still
-- reserved (i.e. not reclaimed).
alter table invoices drop constraint if exists invoices_invoice_no_key;
create unique index if not exists invoices_invoice_no_reserved_key
  on invoices (invoice_no) where number_reclaimed_at is null;

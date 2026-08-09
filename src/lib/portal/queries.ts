import "server-only";
import { sql } from "./db";
import type {
  Address,
  AuditEntry,
  BillRate,
  CompanyProfile,
  Customer,
  DashboardSummary,
  Invoice,
  InvoiceStatus,
  LineItem,
  PublicInvoiceView,
  ReferenceData,
} from "./types";

/**
 * Direct Postgres reads for every `/portal/**` server component. The
 * original (copied-from-elsewhere) design had these RSC pages `fetch()`
 * their *own* app's API over HTTP (`lib/api-server.ts`) — that only ever
 * made sense when frontend and backend were genuinely two different
 * services. Now that they're one Next.js app, that would just be a
 * wasteful self-HTTP-call; this module queries the database directly
 * instead. Client-side mutations (`lib/portal/api.ts`, called from "use
 * client" forms) still go through real `/api/portal/**` routes, since
 * those genuinely originate in the browser.
 */

function rowToCustomer(r: Record<string, unknown>): Customer {
  return {
    id: r.id as string,
    title: r.title as string | null,
    firstName: r.first_name as string | null,
    middleName: r.middle_name as string | null,
    lastName: r.last_name as string | null,
    suffix: r.suffix as string | null,
    name: r.name as string,
    company: r.company as string | null,
    primaryEmail: r.primary_email as string,
    secondaryEmail: r.secondary_email as string | null,
    cc: r.cc as string | null,
    bcc: r.bcc as string | null,
    phone: r.phone as string | null,
    mobile: r.mobile as string | null,
    fax: r.fax as string | null,
    otherContact: r.other_contact as string | null,
    website: r.website as string | null,
    nameToPrintOnChecks: r.name_to_print_on_checks as string | null,
    isSubCustomer: r.is_sub_customer as boolean,
    parentCustomerId: r.parent_customer_id as string | null,
    parentCustomerName: (r.parent_customer_name as string | null) ?? null,
    billingAddress: (r.billing_address as Address | null) ?? null,
    shippingAddress: (r.shipping_address as Address | null) ?? null,
  };
}

function rowToLineItem(r: Record<string, unknown>): LineItem {
  const rateCents = r.rate_cents as number | null;
  return {
    id: r.id as string,
    product: r.product as string,
    month: r.month as string | null,
    description: r.description as string | null,
    qty: Number(r.qty),
    rateCents: rateCents ?? 0,
    billRateId: r.bill_rate_id as string | null,
    amountCents: r.amount_cents as number,
  };
}

async function attachmentsFor(invoiceId: string) {
  const rows = await sql`
    select id, filename, mime_type, size_bytes, uploaded_at, uploaded_by
    from invoice_attachments where invoice_id = ${invoiceId} order by uploaded_at asc
  `;
  return rows.map((r) => ({
    id: r.id as string,
    filename: r.filename as string,
    mimeType: r.mime_type as string,
    sizeBytes: r.size_bytes as number,
    uploadedAt: (r.uploaded_at as Date).toISOString(),
    uploadedBy: r.uploaded_by as string,
  }));
}

async function rowToInvoice(r: Record<string, unknown>): Promise<Invoice> {
  const invoiceId = r.id as string;
  const [lineItemRows, customerRows, attachments] = await Promise.all([
    sql`select * from invoice_line_items where invoice_id = ${invoiceId} order by position asc`,
    sql`select * from customers where id = ${r.customer_id as string}`,
    attachmentsFor(invoiceId),
  ]);
  const lineItems = lineItemRows.map(rowToLineItem);
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  const salesTaxPct = Number(r.sales_tax_pct);
  const salesTaxCents = Math.round(subtotalCents * (salesTaxPct / 100));

  return {
    id: invoiceId,
    invoiceNo: r.invoice_no as string,
    publicToken: r.public_token as string,
    status: r.status as InvoiceStatus,
    customer: rowToCustomer(customerRows[0] as Record<string, unknown>),
    invoiceDate: dateOnly(r.invoice_date),
    dueDate: dateOnly(r.due_date),
    term: r.term as Invoice["term"],
    customTermLabel: r.custom_term_label as string | null,
    customTermDays: r.custom_term_days as number | null,
    lineItems,
    salesTaxPct,
    totals: { subtotalCents, salesTaxCents, totalCents: subtotalCents + salesTaxCents },
    paymentInstructions: r.payment_instructions as string | null,
    noteToCustomer: r.note_to_customer as string | null,
    memoOnStatement: r.memo_on_statement as string | null,
    attachments,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
    createdBy: r.created_by as string,
    reminderCount: r.reminder_count as number,
    lastRemindedAt: r.last_reminded_at ? (r.last_reminded_at as Date).toISOString() : null,
  };
}

function dateOnly(value: unknown): string {
  // Postgres `date` columns come back as JS Date objects (midnight UTC) from
  // the driver — format as a plain YYYY-MM-DD so the UI never has to deal
  // with a timezone-shifted display.
  return (value as Date).toISOString().slice(0, 10);
}

export async function getInvoices(filters?: {
  readonly status?: InvoiceStatus;
  readonly search?: string;
}): Promise<Invoice[]> {
  const status = filters?.status;
  const search = filters?.search?.trim();
  const rows = await sql`
    select id from invoices
    where (${status ?? null}::text is null or status = ${status ?? null})
      and (${search ?? null}::text is null or invoice_no ilike ${search ? `%${search}%` : null})
    order by created_at desc
  `;
  return Promise.all(rows.map((r) => getInvoice(r.id as string)));
}

export async function getInvoice(id: string): Promise<Invoice> {
  const rows = await sql`select * from invoices where id = ${id}`;
  if (rows.length === 0) throw new Error("Invoice not found");
  return rowToInvoice(rows[0] as Record<string, unknown>);
}

export async function getCustomers(): Promise<Customer[]> {
  const rows = await sql`
    select c.*, p.name as parent_customer_name
    from customers c
    left join customers p on p.id = c.parent_customer_id
    order by c.name asc
  `;
  return rows.map((r) => rowToCustomer(r as Record<string, unknown>));
}

export async function getBillRates(): Promise<BillRate[]> {
  const rows = await sql`select * from bill_rates order by effective_from desc`;
  return rows.map((r) => ({
    id: r.id as string,
    product: r.product as string,
    rateCents: r.rate_cents as number,
    currency: "USD",
    effectiveFrom: dateOnly(r.effective_from),
    supersededAt: r.superseded_at ? dateOnly(r.superseded_at) : null,
  }));
}

export async function getAudit(invoiceId?: string): Promise<AuditEntry[]> {
  const rows = invoiceId
    ? await sql`select * from audit_log where invoice_id = ${invoiceId} order by at desc`
    : await sql`select * from audit_log order by at desc limit 200`;
  return rows.map((r) => ({
    id: r.id as string,
    invoiceId: r.invoice_id as string | null,
    action: r.action as string,
    actor: r.actor as string,
    at: (r.at as Date).toISOString(),
    reason: r.reason as string | null,
    before: r.before,
    after: r.after,
  }));
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const rows = await sql`select * from company_profile limit 1`;
  const r = rows[0] as Record<string, unknown>;
  return {
    companyName: r.company_name as string,
    addressLine1: r.address_line1 as string | null,
    addressLine2: r.address_line2 as string | null,
    city: r.city as string | null,
    state: r.state as string | null,
    postalCode: r.postal_code as string | null,
    country: r.country as string | null,
    email: r.email as string | null,
    phone: r.phone as string | null,
    website: r.website as string | null,
    bankName: r.bank_name as string | null,
    routingNumber: r.routing_number as string | null,
    accountNumber: r.account_number as string | null,
    hasLogo: r.logo_bytes !== null,
    logoUrl: r.logo_bytes !== null ? `/api/portal/public/company-logo?v=${(r.updated_at as Date).getTime()}` : null,
    updatedAt: (r.updated_at as Date).toISOString(),
    emailFrom: (r.email_from as string | null) ?? process.env.INVOICE_FROM_EMAIL ?? null,
  };
}

// Mirrors the API route's actual `ALLOWED_NEXT` — see
// `src/app/api/portal/invoices/[id]/transition/route.ts` for how this was
// reconciled from the two real UI call sites.
const STATUS_FLOW: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["submitted"],
  approved: ["submitted", "rejected"],
  submitted: ["paid"],
  rejected: ["draft"],
  paid: [],
};

export async function getReference(): Promise<ReferenceData> {
  return {
    statuses: (Object.keys(STATUS_FLOW) as InvoiceStatus[]).map((status) => ({
      status,
      meaning: statusMeaning(status),
      next: STATUS_FLOW[status],
    })),
    terms: [
      { term: "due_on_receipt", label: "Due on receipt" },
      { term: "net_15", label: "Net 15" },
      { term: "net_30", label: "Net 30" },
      { term: "net_45", label: "Net 45" },
      { term: "net_60", label: "Net 60" },
      { term: "custom", label: "Custom" },
    ],
  };
}

function statusMeaning(status: InvoiceStatus): string {
  switch (status) {
    case "draft":
      return "Being prepared, not yet sent for approval.";
    case "submitted":
      return "Sent for internal approval.";
    case "approved":
      return "Approved and ready to send to the customer.";
    case "rejected":
      return "Sent back for changes.";
    case "paid":
      return "Payment received.";
  }
}

export async function getDashboard(): Promise<DashboardSummary> {
  const [statusRows, totalsRows, overdueRows, activityRows] = await Promise.all([
    sql`select status, count(*)::int as count from invoices group by status`,
    sql`
      select
        coalesce(sum(li.amount_cents), 0)::bigint as total_cents,
        coalesce(sum(li.amount_cents) filter (where i.status in ('approved','submitted')), 0)::bigint as outstanding_cents,
        coalesce(sum(li.amount_cents) filter (where i.status = 'paid'), 0)::bigint as paid_cents
      from invoices i
      left join invoice_line_items li on li.invoice_id = i.id
    `,
    sql`
      select count(*)::int as count, coalesce(sum(li.amount_cents), 0)::bigint as cents
      from invoices i
      left join invoice_line_items li on li.invoice_id = i.id
      where i.status in ('approved', 'submitted') and i.due_date < current_date
    `,
    sql`select * from audit_log order by at desc limit 8`,
  ]);

  const statusCounts = { draft: 0, approved: 0, rejected: 0, submitted: 0, paid: 0 } as Record<
    InvoiceStatus,
    number
  >;
  for (const row of statusRows) {
    statusCounts[row.status as InvoiceStatus] = row.count as number;
  }
  const totals = totalsRows[0] as Record<string, unknown>;
  const overdue = overdueRows[0] as Record<string, unknown>;

  return {
    statusCounts,
    totalInvoiced: Number(totals.total_cents),
    outstandingCents: Number(totals.outstanding_cents),
    paidCents: Number(totals.paid_cents),
    overdueCount: overdue.count as number,
    overdueCents: Number(overdue.cents),
    recentActivity: activityRows.map((r) => ({
      action: r.action as string,
      actor: r.actor as string,
      at: (r.at as Date).toISOString(),
      invoiceId: r.invoice_id as string | null,
      reason: r.reason as string | null,
    })),
  };
}

/**
 * The narrowed, unauthenticated `/pay/[token]` view — a real customer-
 * shareable link. The token in the URL is the only access check (real
 * entropy, generated at invoice-creation time — see `generatePublicToken`
 * usage in the invoices route handler); no session/cookie involved at all.
 * Deliberately excludes email/phone/attachments/memo/audit — only what a
 * payor needs to see.
 */
export async function getPublicInvoiceView(token: string): Promise<PublicInvoiceView | null> {
  const rows = await sql`select * from invoices where public_token = ${token}`;
  if (rows.length === 0) return null;
  const r = rows[0] as Record<string, unknown>;

  const [lineItemRows, customerRows, profileRows] = await Promise.all([
    sql`select * from invoice_line_items where invoice_id = ${r.id as string} order by position asc`,
    sql`select name, company from customers where id = ${r.customer_id as string}`,
    sql`select * from company_profile limit 1`,
  ]);
  const lineItems = lineItemRows.map(rowToLineItem);
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  const salesTaxPct = Number(r.sales_tax_pct);
  const salesTaxCents = Math.round(subtotalCents * (salesTaxPct / 100));
  const customer = customerRows[0] as Record<string, unknown>;
  const profile = profileRows[0] as Record<string, unknown>;

  return {
    invoiceNo: r.invoice_no as string,
    status: r.status as InvoiceStatus,
    from: {
      name: profile.company_name as string,
      email: profile.email as string | null,
      phone: profile.phone as string | null,
      website: profile.website as string | null,
      addressLine1: profile.address_line1 as string | null,
      addressLine2: profile.address_line2 as string | null,
      city: profile.city as string | null,
      state: profile.state as string | null,
      postalCode: profile.postal_code as string | null,
      country: profile.country as string | null,
      logoUrl:
        profile.logo_bytes !== null
          ? `/api/portal/public/company-logo?v=${(profile.updated_at as Date).getTime()}`
          : null,
      bankName: profile.bank_name as string | null,
      routingNumber: profile.routing_number as string | null,
      accountNumber: profile.account_number as string | null,
    },
    customer: { name: customer.name as string, company: customer.company as string | null },
    invoiceDate: dateOnly(r.invoice_date),
    dueDate: dateOnly(r.due_date),
    term: r.term as Invoice["term"],
    customTermLabel: r.custom_term_label as string | null,
    customTermDays: r.custom_term_days as number | null,
    lineItems: lineItems.map(({ product, month, description, qty, rateCents, amountCents }) => ({
      product,
      month,
      description,
      qty,
      rateCents,
      amountCents,
    })),
    salesTaxPct,
    totals: { subtotalCents, salesTaxCents, totalCents: subtotalCents + salesTaxCents },
    paymentInstructions: r.payment_instructions as string | null,
    noteToCustomer: r.note_to_customer as string | null,
  };
}

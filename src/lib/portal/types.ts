/** Domain types shared by the invoice portal's UI, `lib/portal/queries.ts`
 *  (server reads), and the `/api/portal/**` route handlers (mutations). */

export type InvoiceStatus = "draft" | "approved" | "rejected" | "submitted" | "paid";

export type PaymentTerm = "due_on_receipt" | "net_15" | "net_30" | "net_45" | "net_60" | "custom";

export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id?: string;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  name: string;
  company: string | null;
  primaryEmail: string;
  secondaryEmail: string | null;
  cc: string | null;
  bcc: string | null;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  otherContact: string | null;
  website: string | null;
  nameToPrintOnChecks: string | null;
  isSubCustomer: boolean;
  parentCustomerId: string | null;
  parentCustomerName: string | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface LineItem {
  id: string;
  product: string;
  /** Timesheet month this line bills for, e.g. "July". */
  month: string | null;
  description: string | null;
  qty: number;
  rateCents: number;
  billRateId: string | null;
  amountCents: number;
}

export interface InvoiceTotals {
  subtotalCents: number;
  salesTaxCents: number;
  totalCents: number;
}

/** The company letterhead block embedded in `GET /pay/:token` — see
 *  `CompanyProfile` below (the same shape, minus the `hasLogo`/`updatedAt`
 *  fields the authenticated settings page needs but a payor doesn't). */
export interface PublicCompanyInfo {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  logoUrl: string | null;
  bankName: string | null;
  routingNumber: string | null;
  accountNumber: string | null;
}

/** `GET /pay/:token`'s response shape — the deliberately-narrowed public
 *  view (see the `/api/portal/pay/[token]` route handler). No email/phone/attachments/
 *  memo/audit — only what a payor needs to see. */
export interface PublicInvoiceView {
  invoiceNo: string;
  status: InvoiceStatus;
  from: PublicCompanyInfo;
  customer: { name: string; company: string | null };
  invoiceDate: string;
  dueDate: string;
  term: PaymentTerm;
  customTermLabel: string | null;
  customTermDays: number | null;
  lineItems: {
    product: string;
    month: string | null;
    description: string | null;
    qty: number;
    rateCents: number;
    amountCents: number;
  }[];
  salesTaxPct: number;
  totals: InvoiceTotals;
  paymentInstructions: string | null;
  noteToCustomer: string | null;
}

/** `GET /company-profile`'s response shape — the editable letterhead
 *  record (see the `/api/portal/company-profile` route handler). */
export interface CompanyProfile {
  companyName: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  /** Wire/ACH remittance details, shown on the PDF and invoice-ready email. */
  bankName: string | null;
  routingNumber: string | null;
  accountNumber: string | null;
  hasLogo: boolean;
  logoUrl: string | null;
  updatedAt: string;
  /** The real configured sender identity (e.g. `"Tech Pursuit Invoices
   *  <invoices@techpursuitsystems.com>"`) — display-only, for the submit
   *  compose step's "From" field. */
  emailFrom: string | null;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  /** The `/pay/[token]` public share link's key — see
   *  `generatePublicToken`. Real entropy, never derived from `id`. */
  publicToken: string;
  status: InvoiceStatus;
  customer: Customer;
  invoiceDate: string;
  dueDate: string;
  term: PaymentTerm;
  customTermLabel: string | null;
  customTermDays: number | null;
  lineItems: LineItem[];
  salesTaxPct: number;
  totals: InvoiceTotals;
  paymentInstructions: string | null;
  noteToCustomer: string | null;
  memoOnStatement: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  /** How many payment-reminder emails have gone out for this invoice
   *  ("Follow-up #N" in the subject/heading) — see
   *  `POST /api/portal/invoices/:id/remind`. */
  reminderCount: number;
  lastRemindedAt: string | null;
}

export interface BillRate {
  id: string;
  product: string;
  rateCents: number;
  currency: "USD";
  effectiveFrom: string;
  supersededAt: string | null;
}

export interface AuditEntry {
  id: string;
  invoiceId: string | null;
  action: string;
  actor: string;
  at: string;
  reason: string | null;
  before: unknown;
  after: unknown;
}

export interface DashboardSummary {
  statusCounts: Record<InvoiceStatus, number>;
  totalInvoiced: number;
  outstandingCents: number;
  paidCents: number;
  overdueCount: number;
  overdueCents: number;
  recentActivity: {
    action: string;
    actor: string;
    at: string;
    invoiceId: string | null;
    reason: string | null;
  }[];
}

export interface ReferenceData {
  statuses: { status: InvoiceStatus; meaning: string; next: InvoiceStatus[] }[];
  terms: { term: PaymentTerm; label: string }[];
}

/** Line item as entered in the form before pricing/ids are assigned. */
export interface LineItemDraft {
  product: string;
  description: string;
  qty: number;
  rateCents: number | null;
}

/* ---- Auth (email/OTP member login, allowlist-gated) --------------------- */

export interface Member {
  id: string;
  email: string;
  name: string | null;
  /** Gates the delete option in the UI. */
  canDeleteInvoices: boolean;
}

/** The session credential itself is an httpOnly cookie the server sets
 *  directly on the response — never present in this JSON body — so all the
 *  client gets back is the member's display info. */
export interface AuthSession {
  member: Member;
}

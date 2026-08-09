/**
 * Browser client for `/api/portal/**` mutations. Same-origin now (frontend
 * and backend are one Next.js app), so the httpOnly session cookie travels
 * automatically with every request — no manual Bearer-token header like the
 * copied-from-elsewhere version of this file needed (that only existed
 * because invoice-web/invoices-api used to be two different origins).
 * Server-component reads (`getDashboard`, `getInvoices`, …) live in
 * `lib/portal/queries.ts` instead, querying Postgres directly.
 */

import type {
  Address,
  Attachment,
  CompanyProfile,
  Customer,
  Invoice,
  InvoiceStatus,
  PaymentTerm,
} from "./types";

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function clientRequest<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  try {
    const res = await fetch(`/api/portal${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    return (await res.json()) as Envelope<T>;
  } catch {
    return { success: false, data: null, error: "Could not reach the invoice API." };
  }
}

/* ---- Invoices ------------------------------------------------------------ */

export interface CreateInvoicePayload {
  customer: {
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
  };
  invoiceDate: string;
  term: PaymentTerm;
  customTermLabel: string | null;
  customTermDays: number | null;
  salesTaxPct: number;
  paymentInstructions: string | null;
  noteToCustomer: string | null;
  memoOnStatement: string | null;
  lineItems: {
    product: string;
    month: string | null;
    description: string | null;
    qty: number;
    rateCents: number | null;
  }[];
}

export const getNextInvoiceNo = () =>
  clientRequest<{ invoiceNo: string }>("/invoices/next-number", { method: "GET" });

export const createInvoice = (payload: CreateInvoicePayload) =>
  clientRequest<Invoice>("/invoices", { method: "POST", body: JSON.stringify(payload) });

export const updateInvoice = (id: string, payload: Partial<CreateInvoicePayload>) =>
  clientRequest<Invoice>(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const deleteInvoice = (id: string) =>
  clientRequest<{ deleted: boolean }>(`/invoices/${id}`, { method: "DELETE" });

export const transitionInvoice = (
  id: string,
  to: InvoiceStatus,
  reason?: string,
  emailSubject?: string,
) =>
  clientRequest<Invoice>(`/invoices/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({ to, reason: reason ?? null, emailSubject: emailSubject ?? null }),
  });

/* ---- Customers ------------------------------------------------------------ */

export interface CustomerPayload {
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
  billingAddress: Address | null;
  shippingAddress: Address | null;
}

export const createCustomer = (payload: CustomerPayload) =>
  clientRequest<Customer>("/customers", { method: "POST", body: JSON.stringify(payload) });

export const updateCustomer = (id: string, payload: Partial<CustomerPayload>) =>
  clientRequest<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const deleteCustomer = (id: string) =>
  clientRequest<{ deleted: boolean }>(`/customers/${id}`, { method: "DELETE" });

/* ---- Attachments ----------------------------------------------------------- */

export async function uploadAttachments(
  invoiceId: string,
  files: readonly File[],
): Promise<Envelope<Attachment[]>> {
  const form = new FormData();
  for (const f of files) form.append("file", f);
  try {
    const res = await fetch(`/api/portal/invoices/${invoiceId}/attachments`, {
      method: "POST",
      body: form,
    });
    return (await res.json()) as Envelope<Attachment[]>;
  } catch {
    return { success: false, data: null, error: "Could not upload the attachment." };
  }
}

export const deleteAttachment = (invoiceId: string, attachmentId: string) =>
  clientRequest<{ deleted: boolean }>(`/invoices/${invoiceId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });

async function fetchAttachmentBlob(
  invoiceId: string,
  attachmentId: string,
): Promise<{ success: true; blob: Blob } | { success: false; error: string }> {
  try {
    const res = await fetch(`/api/portal/invoices/${invoiceId}/attachments/${attachmentId}/download`);
    if (!res.ok) return { success: false, error: `Could not load the file (${res.status}).` };
    return { success: true, blob: await res.blob() };
  } catch {
    return { success: false, error: "Could not reach the server." };
  }
}

export async function downloadAttachment(invoiceId: string, attachment: Attachment): Promise<void> {
  const res = await fetchAttachmentBlob(invoiceId, attachment.id);
  if (!res.success) return;
  const url = URL.createObjectURL(res.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = attachment.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function previewAttachmentUrl(
  invoiceId: string,
  attachmentId: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const res = await fetchAttachmentBlob(invoiceId, attachmentId);
  if (!res.success) return res;
  return { success: true, url: URL.createObjectURL(res.blob) };
}

/* ---- Company profile -------------------------------------------------------- */

export interface CompanyProfilePatch {
  companyName?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  bankName?: string | null;
  routingNumber?: string | null;
  accountNumber?: string | null;
}

export const getCompanyProfile = () =>
  clientRequest<CompanyProfile>("/company-profile", { method: "GET" });

export const updateCompanyProfile = (patch: CompanyProfilePatch) =>
  clientRequest<CompanyProfile>("/company-profile", { method: "PATCH", body: JSON.stringify(patch) });

export async function uploadCompanyLogo(file: File): Promise<Envelope<CompanyProfile>> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/portal/company-profile/logo", { method: "POST", body: form });
    return (await res.json()) as Envelope<CompanyProfile>;
  } catch {
    return { success: false, data: null, error: "Could not upload the logo." };
  }
}

export const removeCompanyLogo = () =>
  clientRequest<CompanyProfile>("/company-profile/logo", { method: "DELETE" });

/** Cache-busted with `updatedAt` so a replaced logo doesn't keep showing a
 *  stale cached image at the same path. */
export const companyLogoSrc = (updatedAt: string) =>
  `/api/portal/public/company-logo?v=${encodeURIComponent(updatedAt)}`;

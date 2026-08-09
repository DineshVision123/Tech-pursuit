import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getInvoice } from "@/lib/portal/queries";
import { nextInvoiceNumber } from "@/lib/portal/invoice-number";

export const runtime = "nodejs";

const lineItemSchema = z.object({
  product: z.string().min(1),
  month: z.string().nullable(),
  description: z.string().nullable(),
  qty: z.number(),
  rateCents: z.number().nullable(),
});

const invoiceSchema = z.object({
  customer: z.object({
    id: z.string().uuid().optional(),
    title: z.string().nullable(),
    firstName: z.string().nullable(),
    middleName: z.string().nullable(),
    lastName: z.string().nullable(),
    suffix: z.string().nullable(),
    name: z.string().min(1),
    company: z.string().nullable(),
    primaryEmail: z.string().email(),
    secondaryEmail: z.string().nullable(),
    cc: z.string().nullable(),
    bcc: z.string().nullable(),
    phone: z.string().nullable(),
    mobile: z.string().nullable(),
    fax: z.string().nullable(),
    otherContact: z.string().nullable(),
    website: z.string().nullable(),
    nameToPrintOnChecks: z.string().nullable(),
    isSubCustomer: z.boolean(),
    parentCustomerId: z.string().uuid().nullable(),
    parentCustomerName: z.string().nullable(),
    billingAddress: z.unknown().nullable(),
    shippingAddress: z.unknown().nullable(),
  }),
  invoiceDate: z.string(),
  term: z.enum(["due_on_receipt", "net_15", "net_30", "net_45", "net_60", "custom"]),
  customTermLabel: z.string().nullable(),
  customTermDays: z.number().nullable(),
  salesTaxPct: z.number(),
  paymentInstructions: z.string().nullable(),
  noteToCustomer: z.string().nullable(),
  memoOnStatement: z.string().nullable(),
  lineItems: z.array(lineItemSchema),
});

const TERM_DAYS: Record<string, number> = {
  due_on_receipt: 0,
  net_15: 15,
  net_30: 30,
  net_45: 45,
  net_60: 60,
};

function computeDueDate(invoiceDate: string, term: string, customDays: number | null): string {
  const days = term === "custom" ? (customDays ?? 0) : (TERM_DAYS[term] ?? 0);
  const date = new Date(`${invoiceDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const parsed = invoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: "Invalid invoice data." }, { status: 400 });
  }
  const body = parsed.data;

  let customerId = body.customer.id;
  if (!customerId) {
    const c = body.customer;
    const rows = await sql`
      insert into customers (
        title, first_name, middle_name, last_name, suffix, name, company,
        primary_email, secondary_email, cc, bcc, phone, mobile, fax,
        other_contact, website, name_to_print_on_checks, is_sub_customer,
        parent_customer_id, billing_address, shipping_address
      ) values (
        ${c.title}, ${c.firstName}, ${c.middleName}, ${c.lastName}, ${c.suffix}, ${c.name}, ${c.company},
        ${c.primaryEmail}, ${c.secondaryEmail}, ${c.cc}, ${c.bcc}, ${c.phone}, ${c.mobile}, ${c.fax},
        ${c.otherContact}, ${c.website}, ${c.nameToPrintOnChecks}, ${c.isSubCustomer},
        ${c.parentCustomerId}, ${JSON.stringify(c.billingAddress)}, ${JSON.stringify(c.shippingAddress)}
      )
      returning id
    `;
    customerId = (rows[0] as { id: string }).id;
  }

  const invoiceNo = await nextInvoiceNumber();
  const publicToken = randomBytes(24).toString("hex");
  const dueDate = computeDueDate(body.invoiceDate, body.term, body.customTermDays);

  const invoiceRows = await sql`
    insert into invoices (
      invoice_no, public_token, status, customer_id, invoice_date, due_date, term,
      custom_term_label, custom_term_days, sales_tax_pct, payment_instructions,
      note_to_customer, memo_on_statement, created_by
    ) values (
      ${invoiceNo}, ${publicToken}, 'draft', ${customerId}, ${body.invoiceDate}, ${dueDate}, ${body.term},
      ${body.customTermLabel}, ${body.customTermDays}, ${body.salesTaxPct}, ${body.paymentInstructions},
      ${body.noteToCustomer}, ${body.memoOnStatement}, ${member.email}
    )
    returning id
  `;
  const invoiceId = (invoiceRows[0] as { id: string }).id;

  for (const [index, li] of body.lineItems.entries()) {
    const rateCents = li.rateCents ?? 0;
    const amountCents = Math.round(li.qty * rateCents);
    await sql`
      insert into invoice_line_items (invoice_id, position, product, month, description, qty, rate_cents, amount_cents)
      values (${invoiceId}, ${index}, ${li.product}, ${li.month}, ${li.description}, ${li.qty}, ${li.rateCents}, ${amountCents})
    `;
  }

  await sql`
    insert into audit_log (invoice_id, action, actor, after)
    values (${invoiceId}, 'invoice.created', ${member.email}, ${JSON.stringify({ invoiceNo, status: "draft" })})
  `;

  const invoice = await getInvoice(invoiceId);
  return NextResponse.json({ success: true, data: invoice, error: null }, { status: 201 });
}

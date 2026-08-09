import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getInvoice } from "@/lib/portal/queries";

export const runtime = "nodejs";

const lineItemSchema = z.object({
  product: z.string().min(1),
  month: z.string().nullable(),
  description: z.string().nullable(),
  qty: z.number(),
  rateCents: z.number().nullable(),
});

const patchSchema = z.object({
  customer: z
    .object({
      id: z.string().uuid().optional(),
      name: z.string().min(1),
      company: z.string().nullable(),
      primaryEmail: z.string().email(),
      billingAddress: z.unknown().nullable(),
      shippingAddress: z.unknown().nullable(),
    })
    .partial()
    .optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  term: z.enum(["due_on_receipt", "net_15", "net_30", "net_45", "net_60", "custom"]).optional(),
  customTermLabel: z.string().nullable().optional(),
  customTermDays: z.number().nullable().optional(),
  salesTaxPct: z.number().optional(),
  paymentInstructions: z.string().nullable().optional(),
  noteToCustomer: z.string().nullable().optional(),
  memoOnStatement: z.string().nullable().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

// Only a draft (or a rejected one going back to draft) can be edited — an
// approved/submitted/paid invoice is a record of what was actually sent.
const EDITABLE_STATUSES = new Set(["draft", "rejected"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id } = await params;

  const existing = await sql`select status, customer_id from invoices where id = ${id}`;
  if (existing.length === 0) {
    return NextResponse.json({ success: false, data: null, error: "Invoice not found." }, { status: 404 });
  }
  const row = existing[0] as { status: string; customer_id: string };
  if (!EDITABLE_STATUSES.has(row.status)) {
    return NextResponse.json(
      { success: false, data: null, error: "Only a draft or rejected invoice can be edited." },
      { status: 409 },
    );
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: "Invalid invoice data." }, { status: 400 });
  }
  const b = parsed.data;

  await sql`
    update invoices set
      invoice_date = coalesce(${b.invoiceDate ?? null}, invoice_date),
      due_date = coalesce(${b.dueDate ?? null}, due_date),
      term = coalesce(${b.term ?? null}, term),
      custom_term_label = coalesce(${b.customTermLabel}, custom_term_label),
      custom_term_days = coalesce(${b.customTermDays}, custom_term_days),
      sales_tax_pct = coalesce(${b.salesTaxPct ?? null}, sales_tax_pct),
      payment_instructions = coalesce(${b.paymentInstructions}, payment_instructions),
      note_to_customer = coalesce(${b.noteToCustomer}, note_to_customer),
      memo_on_statement = coalesce(${b.memoOnStatement}, memo_on_statement),
      updated_at = now()
    where id = ${id}
  `;

  if (b.customer) {
    const targetCustomerId = b.customer.id ?? row.customer_id;
    await sql`
      update customers set
        name = coalesce(${b.customer.name ?? null}, name),
        company = coalesce(${b.customer.company}, company),
        primary_email = coalesce(${b.customer.primaryEmail ?? null}, primary_email),
        billing_address = coalesce(${b.customer.billingAddress ? JSON.stringify(b.customer.billingAddress) : null}::jsonb, billing_address),
        shipping_address = coalesce(${b.customer.shippingAddress ? JSON.stringify(b.customer.shippingAddress) : null}::jsonb, shipping_address),
        updated_at = now()
      where id = ${targetCustomerId}
    `;
    if (b.customer.id && b.customer.id !== row.customer_id) {
      await sql`update invoices set customer_id = ${b.customer.id} where id = ${id}`;
    }
  }

  if (b.lineItems) {
    await sql`delete from invoice_line_items where invoice_id = ${id}`;
    for (const [index, li] of b.lineItems.entries()) {
      const rateCents = li.rateCents ?? 0;
      const amountCents = Math.round(li.qty * rateCents);
      await sql`
        insert into invoice_line_items (invoice_id, position, product, month, description, qty, rate_cents, amount_cents)
        values (${id}, ${index}, ${li.product}, ${li.month}, ${li.description}, ${li.qty}, ${li.rateCents}, ${amountCents})
      `;
    }
  }

  await sql`
    insert into audit_log (invoice_id, action, actor)
    values (${id}, 'invoice.updated', ${member.email})
  `;

  const invoice = await getInvoice(id);
  return NextResponse.json({ success: true, data: invoice, error: null });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  if (!member.canDeleteInvoices) {
    return NextResponse.json(
      { success: false, data: null, error: "You don't have permission to delete invoices." },
      { status: 403 },
    );
  }
  const { id } = await params;

  await sql`insert into audit_log (invoice_id, action, actor) values (${id}, 'invoice.deleted', ${member.email})`;
  await sql`delete from invoices where id = ${id}`;
  return NextResponse.json({ success: true, data: { deleted: true }, error: null });
}

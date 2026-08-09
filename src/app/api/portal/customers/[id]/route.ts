import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getCustomers } from "@/lib/portal/queries";

export const runtime = "nodejs";

const patchSchema = z
  .object({
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
    billingAddress: z.unknown().nullable(),
    shippingAddress: z.unknown().nullable(),
  })
  .partial();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: "Invalid customer data." }, { status: 400 });
  }
  const c = parsed.data;

  await sql`
    update customers set
      title = coalesce(${c.title}, title),
      first_name = coalesce(${c.firstName}, first_name),
      middle_name = coalesce(${c.middleName}, middle_name),
      last_name = coalesce(${c.lastName}, last_name),
      suffix = coalesce(${c.suffix}, suffix),
      name = coalesce(${c.name}, name),
      company = coalesce(${c.company}, company),
      primary_email = coalesce(${c.primaryEmail}, primary_email),
      secondary_email = coalesce(${c.secondaryEmail}, secondary_email),
      cc = coalesce(${c.cc}, cc),
      bcc = coalesce(${c.bcc}, bcc),
      phone = coalesce(${c.phone}, phone),
      mobile = coalesce(${c.mobile}, mobile),
      fax = coalesce(${c.fax}, fax),
      other_contact = coalesce(${c.otherContact}, other_contact),
      website = coalesce(${c.website}, website),
      name_to_print_on_checks = coalesce(${c.nameToPrintOnChecks}, name_to_print_on_checks),
      is_sub_customer = coalesce(${c.isSubCustomer ?? null}, is_sub_customer),
      parent_customer_id = coalesce(${c.parentCustomerId}, parent_customer_id),
      billing_address = coalesce(${c.billingAddress ? JSON.stringify(c.billingAddress) : null}::jsonb, billing_address),
      shipping_address = coalesce(${c.shippingAddress ? JSON.stringify(c.shippingAddress) : null}::jsonb, shipping_address),
      updated_at = now()
    where id = ${id}
  `;

  const customers = await getCustomers();
  const match = customers.find((cust) => cust.id === id);
  if (!match) {
    return NextResponse.json({ success: false, data: null, error: "Customer not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: match, error: null });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id } = await params;

  try {
    await sql`delete from customers where id = ${id}`;
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Can't delete a customer that has invoices." },
      { status: 409 },
    );
  }
  return NextResponse.json({ success: true, data: { deleted: true }, error: null });
}

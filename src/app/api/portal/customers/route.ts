import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getCustomers } from "@/lib/portal/queries";

export const runtime = "nodejs";

const addressSchema = z
  .object({
    line1: z.string(),
    line2: z.string().nullable(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  })
  .nullable();

const customerSchema = z.object({
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
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
});

export async function GET() {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const customers = await getCustomers();
  return NextResponse.json({ success: true, data: customers, error: null });
}

export async function POST(request: Request) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const parsed = customerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: "Invalid customer data." }, { status: 400 });
  }
  const c = parsed.data;

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

  const created = await getCustomers();
  const match = created.find((cust) => cust.id === (rows[0] as { id: string }).id);
  return NextResponse.json({ success: true, data: match, error: null }, { status: 201 });
}

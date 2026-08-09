import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getCompanyProfile } from "@/lib/portal/queries";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    companyName: z.string(),
    addressLine1: z.string().nullable(),
    addressLine2: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    postalCode: z.string().nullable(),
    country: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    website: z.string().nullable(),
    bankName: z.string().nullable(),
    routingNumber: z.string().nullable(),
    accountNumber: z.string().nullable(),
  })
  .partial();

export async function GET() {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const profile = await getCompanyProfile();
  return NextResponse.json({ success: true, data: profile, error: null });
}

export async function PATCH(request: Request) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: "Invalid company profile data." }, { status: 400 });
  }
  const p = parsed.data;

  await sql`
    update company_profile set
      company_name = coalesce(${p.companyName ?? null}, company_name),
      address_line1 = coalesce(${p.addressLine1}, address_line1),
      address_line2 = coalesce(${p.addressLine2}, address_line2),
      city = coalesce(${p.city}, city),
      state = coalesce(${p.state}, state),
      postal_code = coalesce(${p.postalCode}, postal_code),
      country = coalesce(${p.country}, country),
      email = coalesce(${p.email}, email),
      phone = coalesce(${p.phone}, phone),
      website = coalesce(${p.website}, website),
      bank_name = coalesce(${p.bankName}, bank_name),
      routing_number = coalesce(${p.routingNumber}, routing_number),
      account_number = coalesce(${p.accountNumber}, account_number),
      updated_at = now()
    where id = true
  `;

  const profile = await getCompanyProfile();
  return NextResponse.json({ success: true, data: profile, error: null });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';

export const runtime = 'nodejs';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(120),
  email: z.string().trim().email('Enter a valid email'),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  budget: z.string().trim().max(80).optional().or(z.literal('')),
  // Job-application-only fields — empty/absent for a regular project inquiry.
  role: z.string().trim().max(160).optional().or(z.literal('')),
  portfolioUrl: z.string().trim().max(300).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Tell us a bit more').max(4000),
});

/**
 * Contact form endpoint. No database — validates input, attempts to send
 * email via Resend, and always responds with a plain success/error shape.
 * If email isn't configured, sendContactEmail() no-ops and still returns ok.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { success: false, error: firstIssue?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const result = await sendContactEmail(parsed.data);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, error: null });
}

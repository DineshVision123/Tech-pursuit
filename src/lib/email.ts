import { Resend } from 'resend';
import type { ContactFormValues } from '@/types';

type SendResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

/**
 * Sends a contact-form submission via Resend. Deliberately has no database
 * fallback — per design, if credentials aren't configured this is a safe
 * no-op that still reports success to the client (nothing is silently lost
 * from the user's point of view, and nothing is persisted either).
 */
export async function sendContactEmail(values: ContactFormValues): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    console.info(
      '[contact] Email not sent — RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL not configured. Submission:',
      { ...values },
    );
    return { ok: true };
  }

  try {
    const isApplication = Boolean(values.role);
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: values.email,
      subject: isApplication
        ? `New job application — ${values.role} (${values.name})`
        : `New project inquiry — ${values.name}${values.company ? ` (${values.company})` : ''}`,
      text: [
        `Name: ${values.name}`,
        `Email: ${values.email}`,
        values.role ? `Applying for: ${values.role}` : null,
        values.portfolioUrl ? `Portfolio/LinkedIn: ${values.portfolioUrl}` : null,
        !isApplication && values.company ? `Company: ${values.company}` : null,
        !isApplication && values.budget ? `Budget: ${values.budget}` : null,
        '',
        'Message:',
        values.message,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    if (error) {
      console.error('[contact] Resend API error:', error);
      return { ok: false, error: 'Failed to send email' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[contact] Unexpected error sending email:', err);
    return { ok: false, error: 'Unexpected error sending email' };
  }
}

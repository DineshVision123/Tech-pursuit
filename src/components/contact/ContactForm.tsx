'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type ContactFormProps = {
  /**
   * Set when reached via a careers "Apply" link — swaps the
   * company/budget fields for a position + portfolio/resume-link field,
   * and adjusts every label/placeholder/button that assumed a sales
   * inquiry rather than a job application.
   */
  readonly applyingForRole?: string;
};

const inputClass =
  'type-form-input btn-focus w-full rounded-xl border border-ink-900/10 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brand-400';

const labelClass = 'type-form-label mb-1.5 block text-ink-700';

export function ContactForm({ applyingForRole }: ContactFormProps) {
  const isApplication = Boolean(applyingForRole);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      company: String(data.get('company') ?? ''),
      budget: String(data.get('budget') ?? ''),
      role: String(data.get('role') ?? ''),
      portfolioUrl: String(data.get('portfolioUrl') ?? ''),
      message: String(data.get('message') ?? ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatus('error');
        setErrorMessage(json.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated flex flex-col items-center gap-3 p-10 text-center"
      >
        <CheckCircle2 size={40} className="text-brand-600" />
        <h3 className="type-card text-ink-900">
          {isApplication ? 'Application sent' : 'Message sent'}
        </h3>
        <p className="type-small max-w-sm text-ink-500">
          {isApplication
            ? 'Thanks for applying — we review every application and typically follow up within one business day.'
            : 'Thanks for reaching out — we typically reply within one business day.'}
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="type-button btn-focus mt-2 text-brand-600 hover:text-brand-700"
        >
          {isApplication ? 'Send another application' : 'Send another message'}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-elevated space-y-5 p-8 lg:p-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input id="name" name="name" required className={inputClass} placeholder="Jane Doe" />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="jane@company.com"
          />
        </div>
      </div>

      {isApplication ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="role" className={labelClass}>
              Position
            </label>
            <input
              id="role"
              name="role"
              required
              defaultValue={applyingForRole}
              className={inputClass}
              placeholder="Which role are you applying for?"
            />
          </div>
          <div>
            <label htmlFor="portfolioUrl" className={labelClass}>
              Portfolio / LinkedIn / resume link <span className="text-ink-300">(optional)</span>
            </label>
            <input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              className={inputClass}
              placeholder="https://"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="company" className={labelClass}>
              Company <span className="text-ink-300">(optional)</span>
            </label>
            <input id="company" name="company" className={inputClass} placeholder="Company Inc." />
          </div>
          <div>
            <label htmlFor="budget" className={labelClass}>
              Budget range <span className="text-ink-300">(optional)</span>
            </label>
            <select id="budget" name="budget" className={inputClass} defaultValue="">
              <option value="" disabled>
                Select a range
              </option>
              <option value="< $25k">Under $25k</option>
              <option value="$25k–$75k">$25k – $75k</option>
              <option value="$75k–$200k">$75k – $200k</option>
              <option value="$200k+">$200k+</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="message" className={labelClass}>
          {isApplication ? 'Why are you a great fit for this role?' : 'Tell us about your project'}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={cn(inputClass, 'resize-none')}
          placeholder={
            isApplication
              ? 'A quick note on your background and why this role is a fit.'
              : 'What are you looking to build?'
          }
        />
      </div>

      {status === 'error' && (
        <div className="type-small flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="type-button btn-focus inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-white shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100"
      >
        {status === 'submitting' && <Loader2 size={16} className="animate-spin" />}
        {status === 'submitting' ? 'Sending…' : isApplication ? 'Send Application' : 'Send Message'}
      </button>
    </form>
  );
}

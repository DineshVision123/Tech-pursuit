"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShieldCheck, Loader2 } from "lucide-react";
import { requestEmailOtp, verifyEmailOtp } from "@/lib/portal/auth-client";

type Step = "identifier" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("identifier");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed.includes("@") || !trimmed.includes(".") || trimmed.length < 6) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const result = await requestEmailOtp(trimmed);
    setSubmitting(false);
    if (!result.success || !result.data) {
      setError(result.error ?? "Could not send the code. Please try again.");
      return;
    }
    setRequestId(result.data.requestId);
    setStep("otp");
  }

  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!requestId) {
      setError("Something went wrong — request a new code.");
      setStep("identifier");
      return;
    }
    if (otp.trim().length < 4) {
      setError("Enter the code we sent you.");
      return;
    }
    setSubmitting(true);
    const result = await verifyEmailOtp(requestId, otp.trim());
    setSubmitting(false);
    if (!result.success || !result.data) {
      setError(result.error ?? "Incorrect code. Please try again.");
      return;
    }
    // "/" (the marketing homepage) is never the right fallback here — the
    // portal's own home is "/portal".
    const next = searchParams?.get("next");
    router.replace(next && next.startsWith("/portal") ? next : "/portal");
    router.refresh();
  }

  async function onResend() {
    setError(null);
    setSubmitting(true);
    const result = await requestEmailOtp(email.trim());
    setSubmitting(false);
    if (!result.success || !result.data) {
      setError(result.error ?? "Could not resend the code.");
      return;
    }
    setRequestId(result.data.requestId);
    setOtp("");
  }

  return (
    <AnimatePresence mode="wait">
      {step === "identifier" ? (
        <motion.form
          key="identifier"
          onSubmit={onSendCode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="stack"
          noValidate
        >
          <div>
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <div className="vs-input-icon">
              <Mail size={16} />
              <input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="you@company.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
          {error ? (
            <div className="banner banner--danger" role="alert">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {submitting ? <Loader2 size={16} className="vs-spin" /> : null}
            Send code
          </button>
        </motion.form>
      ) : (
        <motion.form
          key="otp"
          onSubmit={onVerify}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="stack"
          noValidate
        >
          <p className="muted" style={{ margin: 0 }}>
            Enter the code sent to <strong>{email.trim()}</strong>.
          </p>
          <div>
            <label className="label" htmlFor="login-otp">
              Verification code
            </label>
            <div className="vs-input-icon">
              <ShieldCheck size={16} />
              <input
                id="login-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
          {error ? (
            <div className="banner banner--danger" role="alert">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {submitting ? <Loader2 size={16} className="vs-spin" /> : null}
            Verify &amp; sign in
          </button>
          <div className="row between">
            <button
              type="button"
              className="vs-link-btn"
              onClick={() => {
                setStep("identifier");
                setOtp("");
                setError(null);
              }}
            >
              Change
            </button>
            <button type="button" className="vs-link-btn" onClick={onResend} disabled={submitting}>
              Resend code
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

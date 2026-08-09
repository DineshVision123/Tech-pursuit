"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Upload, Trash2 } from "lucide-react";
import {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  removeCompanyLogo,
  companyLogoSrc,
} from "@/lib/portal/api";
import type { CompanyProfile } from "@/lib/portal/types";

interface FormState {
  companyName: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
}

function toFormState(p: CompanyProfile): FormState {
  return {
    companyName: p.companyName,
    email: p.email ?? "",
    phone: p.phone ?? "",
    website: p.website ?? "",
    addressLine1: p.addressLine1 ?? "",
    addressLine2: p.addressLine2 ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    postalCode: p.postalCode ?? "",
    country: p.country ?? "",
    bankName: p.bankName ?? "",
    routingNumber: p.routingNumber ?? "",
    accountNumber: p.accountNumber ?? "",
  };
}

/**
 * The company letterhead shown on outgoing invoices — name, address, email,
 * and logo. Any logged-in member can edit it (same flat-access convention
 * as Team access used to be) — this app serves one business, not a
 * multi-tenant roster of them.
 */
export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // "Saved." flashes green then clears itself — this timer is what reverts
  // it back to nothing rather than leaving a stale confirmation on screen.
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    const res = await getCompanyProfile();
    if (!res.success || !res.data) {
      setLoadError(res.error ?? "Failed to load the company profile.");
      setLoading(false);
      return;
    }
    setProfile(res.data);
    setForm(toFormState(res.data));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const res = await updateCompanyProfile({
      companyName: form.companyName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      addressLine1: form.addressLine1.trim() || null,
      addressLine2: form.addressLine2.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      postalCode: form.postalCode.trim() || null,
      country: form.country.trim() || null,
      bankName: form.bankName.trim() || null,
      routingNumber: form.routingNumber.trim() || null,
      accountNumber: form.accountNumber.trim() || null,
    });
    setSaving(false);
    if (!res.success || !res.data) {
      setSaveError(res.error ?? "Failed to save the company profile.");
      return;
    }
    setProfile(res.data);
    setForm(toFormState(res.data));
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogoSelect(file: File) {
    setLogoBusy(true);
    setLogoError(null);
    const res = await uploadCompanyLogo(file);
    setLogoBusy(false);
    if (!res.success || !res.data) {
      setLogoError(res.error ?? "Failed to upload the logo.");
      return;
    }
    setProfile(res.data);
  }

  async function handleLogoRemove() {
    setLogoBusy(true);
    setLogoError(null);
    const res = await removeCompanyLogo();
    setLogoBusy(false);
    if (!res.success || !res.data) {
      setLogoError(res.error ?? "Failed to remove the logo.");
      return;
    }
    setProfile(res.data);
  }

  return (
    <div className="stack-lg">
      <p className="page-subtitle">
        This name, address, email, and logo appear on every invoice you send.
      </p>

      {loading && <p className="muted">Loading…</p>}
      {loadError && <p className="form-error">{loadError}</p>}

      {!loading && !loadError && profile && form && (
        <>
          <section className="card pad">
            <h2 className="section-title">Logo</h2>
            <div
              className="row"
              style={{ gap: "1.25rem", alignItems: "center", marginTop: "0.75rem" }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  border: "1px solid var(--portal-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: "var(--portal-surface-2, rgba(127,127,127,0.08))",
                }}
              >
                {profile.hasLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={companyLogoSrc(profile.updatedAt)}
                    alt="Company logo"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span className="muted-3" style={{ fontSize: "0.72rem" }}>
                    No logo
                  </span>
                )}
              </div>
              <div className="stack" style={{ gap: "0.5rem" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleLogoSelect(file);
                    e.target.value = "";
                  }}
                />
                <div className="row" style={{ gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={logoBusy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoBusy ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
                    {profile.hasLogo ? "Replace logo" : "Upload logo"}
                  </button>
                  {profile.hasLogo && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={logoBusy}
                      onClick={() => void handleLogoRemove()}
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  )}
                </div>
                <small className="muted-3">PNG, JPEG, WebP, or SVG — up to 5 MB.</small>
                {logoError && <p className="form-error">{logoError}</p>}
              </div>
            </div>
          </section>

          <section className="card pad">
            <h2 className="section-title">Details</h2>
            <div className="field-grid-2" style={{ marginTop: "0.75rem" }}>
              <label className="field">
                <span className="label">Company name *</span>
                <input
                  className="input"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">Email</span>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="billing@yourcompany.com"
                />
              </label>
              <label className="field">
                <span className="label">Phone</span>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (828) 301-5853"
                />
              </label>
              <label className="field">
                <span className="label">Website</span>
                <input
                  className="input"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://www.yourcompany.com"
                />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span className="label">Address line 1</span>
                <input
                  className="input"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span className="label">Address line 2</span>
                <input
                  className="input"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">City</span>
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">State</span>
                <input
                  className="input"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">Postal code</span>
                <input
                  className="input"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">Country</span>
                <input
                  className="input"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="card pad">
            <h2 className="section-title">Payment details</h2>
            <p className="muted-3" style={{ fontSize: "0.78rem", marginTop: "0.35rem" }}>
              Wire/ACH remittance info — shown on the invoice PDF and the invoice-ready email so a
              client knows where to send payment.
            </p>
            <div className="field-grid-2" style={{ marginTop: "0.75rem" }}>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span className="label">Bank name</span>
                <input
                  className="input"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="Truist Bank"
                />
              </label>
              <label className="field">
                <span className="label">Routing number</span>
                <input
                  className="input"
                  value={form.routingNumber}
                  onChange={(e) => setForm({ ...form, routingNumber: e.target.value })}
                  placeholder="053101121"
                />
              </label>
              <label className="field">
                <span className="label">Account number</span>
                <input
                  className="input"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="1340025378635"
                />
              </label>
            </div>
          </section>

          <section className="card pad">
            {saveError && <p className="form-error">{saveError}</p>}
            <div className="row" style={{ gap: "0.75rem", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || !form.companyName.trim()}
                onClick={() => void handleSave()}
              >
                {saving && <Loader2 size={16} className="spin" />}
                Save
              </button>
              <AnimatePresence>
                {saved && !saving && (
                  <motion.span
                    className="text-sm"
                    style={{ color: "var(--portal-paid)", fontWeight: 600 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Saved.
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

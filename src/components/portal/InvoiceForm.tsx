"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  UserPlus,
  Paperclip,
  X,
  ArrowLeft,
  Mail,
  Download,
  Eye,
} from "lucide-react";
import {
  createInvoice,
  updateInvoice,
  uploadAttachments,
  getCompanyProfile,
  companyLogoSrc,
  transitionInvoice,
  getNextInvoiceNo,
  createCustomer,
  updateCustomer,
  type CreateInvoicePayload,
  type CustomerPayload,
} from "@/lib/portal/api";
import { downloadElementAsPdf } from "@/lib/portal/pdf";
import type { InvoiceDraftCompany } from "./InvoicePreview";
import {
  money,
  formatBytes,
  displayNameWithParent,
  TERM_LABEL,
  MONTH_NAMES,
  currentMonthName,
} from "@/lib/portal/format";
import { AnimatedNumber } from "./AnimatedNumber";
import { AttachmentList } from "./AttachmentList";
import { AttachmentPreviewModal } from "./AttachmentPreviewModal";
import { CustomerPicker, NEW_CUSTOMER_VALUE } from "./CustomerPicker";
import { InvoicePreview, type InvoiceDraft, type PreviewTab } from "./InvoicePreview";
import { useSetTopBarSuffix } from "./TopBarSuffix";
import type { Address, Attachment, BillRate, Customer, Invoice, PaymentTerm } from "@/lib/portal/types";

interface RowState {
  key: string;
  product: string;
  month: string;
  description: string;
  qty: string;
  /** Raw text like "19.99", not cents — same treatment as `qty`, parsed only
   *  at the use sites. Keeping the typed characters (rather than round-
   *  tripping through a number every keystroke) is what lets a half-finished
   *  "19." survive, and is why these fields are `type="text"`: see
   *  `rateTextToCents`. */
  rate: string;
}

interface AddressDraft {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMPTY_ADDRESS: AddressDraft = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

function addressToDraft(addr: Address | null): AddressDraft {
  if (!addr) return { ...EMPTY_ADDRESS };
  return {
    line1: addr.line1,
    line2: addr.line2 ?? "",
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
  };
}

function hasAddressValue(a: AddressDraft): boolean {
  return Boolean(
    a.line1.trim() || a.city.trim() || a.state.trim() || a.postalCode.trim() || a.country.trim(),
  );
}

function addressPayload(a: AddressDraft): Address | null {
  if (!hasAddressValue(a)) return null;
  return {
    line1: a.line1.trim(),
    line2: a.line2.trim() || null,
    city: a.city.trim(),
    state: a.state.trim(),
    postalCode: a.postalCode.trim(),
    country: a.country.trim(),
  };
}

interface CustomerDraft {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  name: string;
  company: string;
  primaryEmail: string;
  secondaryEmail: string;
  cc: string;
  bcc: string;
  phone: string;
  mobile: string;
  fax: string;
  otherContact: string;
  website: string;
  nameToPrintOnChecks: string;
  isSubCustomer: boolean;
  parentCustomerId: string;
}

const EMPTY_CUSTOMER: CustomerDraft = {
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  name: "",
  company: "",
  primaryEmail: "",
  secondaryEmail: "",
  cc: "",
  bcc: "",
  phone: "",
  mobile: "",
  fax: "",
  otherContact: "",
  website: "",
  nameToPrintOnChecks: "",
  isSubCustomer: false,
  parentCustomerId: "",
};

function customerToDraft(c: Customer): CustomerDraft {
  return {
    title: c.title ?? "",
    firstName: c.firstName ?? "",
    middleName: c.middleName ?? "",
    lastName: c.lastName ?? "",
    suffix: c.suffix ?? "",
    name: c.name,
    company: c.company ?? "",
    primaryEmail: c.primaryEmail,
    secondaryEmail: c.secondaryEmail ?? "",
    cc: c.cc ?? "",
    bcc: c.bcc ?? "",
    phone: c.phone ?? "",
    mobile: c.mobile ?? "",
    fax: c.fax ?? "",
    otherContact: c.otherContact ?? "",
    website: c.website ?? "",
    nameToPrintOnChecks: c.nameToPrintOnChecks ?? "",
    isSubCustomer: c.isSubCustomer,
    parentCustomerId: c.parentCustomerId ?? "",
  };
}

const TERMS: PaymentTerm[] = ["due_on_receipt", "net_30", "net_45", "net_60", "custom"];
const FIXED_TERM_DAYS: Record<Exclude<PaymentTerm, "custom">, number> = {
  due_on_receipt: 0,
  net_15: 15,
  net_30: 30,
  net_45: 45,
  net_60: 60,
};

function round(n: number): number {
  return n < 0 ? -Math.round(-n) : Math.round(n);
}

/**
 * `"19.99"` → `1999`. Blank or unparseable → `null`, which the API reads as
 * "price this line from the bill-rate catalog" (see `priceLines` in
 * invoices-api's `invoice-service.ts`) — so an empty Rate is a real signal,
 * not a zero.
 */
function rateTextToCents(rate: string): number | null {
  const n = Number.parseFloat(rate);
  return Number.isFinite(n) ? round(n * 100) : null;
}

/**
 * Money, to at most 2dp — also matches the empty string and a trailing dot
 * ("19.") so a decimal can actually be typed left-to-right.
 *
 * These fields are deliberately `type="text"` + `inputMode="decimal"` rather
 * than `type="number"`. A number input lets the browser rewrite the value
 * behind the user's back — arrow keys and (in older Chrome) a stray mouse
 * wheel both `stepDown()`, silently turning a typed 20 into 19.99 — and it
 * reports `value === ""` for a half-typed "19.", which would wipe the field
 * mid-keystroke. Text input plus these guards keeps what was typed.
 */
const MONEY_TEXT = /^\d*\.?\d{0,2}$/;
const QTY_TEXT = /^\d*\.?\d*$/;
const INT_TEXT = /^\d*$/;

function newKey(): string {
  return Math.random().toString(36).slice(2, 9);
}

function toRow(product = "", rate = ""): RowState {
  return {
    key: newKey(),
    product,
    month: currentMonthName(),
    description: "",
    qty: "",
    rate,
  };
}

export function InvoiceForm({
  billRates,
  invoice,
  customers: initialCustomers = [],
}: {
  billRates: BillRate[];
  invoice?: Invoice;
  customers?: Customer[];
}) {
  const router = useRouter();
  const editing = Boolean(invoice);
  // The bottom action bar is portaled straight to `document.body` (see the
  // return below) so its `position: fixed` is always relative to the
  // viewport, never trapped by AppShell's page-transition `motion.div`
  // (a transformed ancestor turns `fixed` into effectively `absolute`,
  // which is why it was only scrolling into view instead of staying put).
  // Portals need the DOM to exist, so this flips true after mount.
  const [actionBarMounted, setActionBarMounted] = useState(false);
  // Intentional client-only-mount flag for the portal below, not state
  // synced from an external system; there's no dependency to subscribe to
  // instead.
  useEffect(() => setActionBarMounted(true), []);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("edit");
  // Local copy so deleting a customer from the picker updates this list
  // immediately, without needing a full server round-trip/refetch.
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const handleCustomerDeleted = (id: string) =>
    setCustomers((prev) => prev.filter((c) => c.id !== id));

  const [customer, setCustomer] = useState<CustomerDraft>(
    invoice ? customerToDraft(invoice.customer) : { ...EMPTY_CUSTOMER },
  );
  // Whether "Customer display name" should keep auto-deriving from
  // first/last name — stops the moment the user types into that field
  // directly, so it never clobbers a manually-chosen display name.
  const [displayNameAuto, setDisplayNameAuto] = useState(!invoice);
  const [billingAddress, setBillingAddress] = useState<AddressDraft>(
    addressToDraft(invoice?.customer.billingAddress ?? null),
  );
  const [shipSameAsBilling, setShipSameAsBilling] = useState(
    !invoice?.customer.shippingAddress ||
      JSON.stringify(invoice.customer.shippingAddress) ===
        JSON.stringify(invoice.customer.billingAddress),
  );
  const [shippingAddress, setShippingAddress] = useState<AddressDraft>(
    addressToDraft(invoice?.customer.shippingAddress ?? null),
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    invoice?.customer.id ?? null,
  );
  // Existing customer picked → show a compact "Bill to" summary instead of
  // the full 20-field form; "Edit Customer" (or picking "+ New customer")
  // reveals it. Editing an existing invoice always shows the full form —
  // the picker itself is hidden in that mode (see `!editing` guard below).
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  // New invoice, landing fresh: nothing below the picker (customer
  // fields/Line items/Attachments/Notes) renders until the user actually
  // picks an existing customer or starts a new one — set true by
  // `onPickCustomer`. Always true while editing (unchanged behavior).
  const [customerChosen, setCustomerChosen] = useState(editing);
  // Saving the customer record itself — separate from saving the invoice.
  // A brand-new customer has no id until this succeeds; an existing one
  // being re-edited via "Edit Customer" updates in place.
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  // Which customer record (if any) THIS "Edit Customer" session is bound to,
  // for "Save customer"/"Cancel" purposes — deliberately separate from
  // `selectedCustomerId`, which `updateCustomerField` et al. null out on
  // every keystroke (correct for the invoice's own payload: an edited field
  // means the invoice should embed a fresh customer, not silently mutate the
  // shared master record). This id must survive those keystrokes, or Cancel
  // would vanish and Save would create a duplicate the moment anything changed.
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // "Review and submit" (bottom bar) — shows an editable Subject/Message
  // compose panel side by side with the live Email preview, and the PDF view
  // below, so the exact email, the send fields, and the formal document are
  // all visible together before "Confirm and submit" does the real send in
  // one step.
  const [reviewing, setReviewing] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  // Id of whichever invoice this session has already persisted (new-invoice
  // case only — an existing invoice always has `invoice.id`). Remembered so
  // going back-and-forth between review/compose and clicking Save or
  // Confirm-and-submit again updates that same record instead of minting a
  // second, duplicate invoice.
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);

  const onPickCustomer = (value: string) => {
    setShowCustomerDetails(false);
    setCustomerChosen(true);
    setCustomerError(null);
    if (value === NEW_CUSTOMER_VALUE) {
      setSelectedCustomerId(null);
      setEditingCustomerId(null);
      setCustomer({ ...EMPTY_CUSTOMER });
      setDisplayNameAuto(true);
      setBillingAddress({ ...EMPTY_ADDRESS });
      setShippingAddress({ ...EMPTY_ADDRESS });
      setShipSameAsBilling(true);
      return;
    }
    const picked = customers.find((c) => c.id === value);
    if (!picked) return;
    setSelectedCustomerId(picked.id ?? null);
    setEditingCustomerId(picked.id ?? null);
    setCustomer(customerToDraft(picked));
    setDisplayNameAuto(false);
    setBillingAddress(addressToDraft(picked.billingAddress));
    setShippingAddress(addressToDraft(picked.shippingAddress));
    setShipSameAsBilling(
      !picked.shippingAddress ||
        JSON.stringify(picked.shippingAddress) === JSON.stringify(picked.billingAddress),
    );
  };

  /** "Save customer" — persists the customer as its own record (creating a
   *  brand-new one, or updating the one being re-edited via "Edit Customer")
   *  independently of the invoice. Collapses back to the compact "Bill to"
   *  view on success, which is what reveals the rest of the invoice form. */
  const saveCustomer = async () => {
    setCustomerError(null);
    if (!customer.name.trim()) {
      setCustomerError("Customer display name is required.");
      return;
    }
    if (!customer.primaryEmail.trim()) {
      setCustomerError("Primary email is required.");
      return;
    }

    const parent = customer.isSubCustomer
      ? customers.find((c) => c.id === customer.parentCustomerId)
      : undefined;

    const payload: CustomerPayload = {
      title: customer.title.trim() || null,
      firstName: customer.firstName.trim() || null,
      middleName: customer.middleName.trim() || null,
      lastName: customer.lastName.trim() || null,
      suffix: customer.suffix.trim() || null,
      name: customer.name.trim(),
      company: customer.company.trim() || null,
      primaryEmail: customer.primaryEmail.trim(),
      secondaryEmail: customer.secondaryEmail.trim() || null,
      cc: customer.cc.trim() || null,
      bcc: customer.bcc.trim() || null,
      phone: customer.phone.trim() || null,
      mobile: customer.mobile.trim() || null,
      fax: customer.fax.trim() || null,
      otherContact: customer.otherContact.trim() || null,
      website: customer.website.trim() || null,
      nameToPrintOnChecks: customer.nameToPrintOnChecks.trim() || null,
      isSubCustomer: customer.isSubCustomer && Boolean(parent),
      parentCustomerId: parent?.id ?? null,
      billingAddress: addressPayload(billingAddress),
      shippingAddress: shipSameAsBilling
        ? addressPayload(billingAddress)
        : addressPayload(shippingAddress),
    };

    setSavingCustomer(true);
    const res = editingCustomerId
      ? await updateCustomer(editingCustomerId, payload)
      : await createCustomer(payload);
    setSavingCustomer(false);

    if (!res.success || !res.data) {
      setCustomerError(res.error ?? "Could not save the customer.");
      return;
    }

    const saved = res.data;
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    setSelectedCustomerId(saved.id ?? null);
    setEditingCustomerId(saved.id ?? null);
    setShowCustomerDetails(false);
  };

  /** "Cancel" (only shown when re-editing an existing customer) — discards
   *  whatever was typed and reverts the draft back to that customer's last
   *  saved values before collapsing to the compact view, so an abandoned
   *  edit can never ride along unsaved into the invoice payload. */
  const cancelCustomerEdit = () => {
    setCustomerError(null);
    const original = customers.find((c) => c.id === editingCustomerId);
    if (original) {
      setCustomer(customerToDraft(original));
      setDisplayNameAuto(false);
      setSelectedCustomerId(original.id ?? null);
      setBillingAddress(addressToDraft(original.billingAddress));
      setShippingAddress(addressToDraft(original.shippingAddress));
      setShipSameAsBilling(
        !original.shippingAddress ||
          JSON.stringify(original.shippingAddress) === JSON.stringify(original.billingAddress),
      );
    }
    setShowCustomerDetails(false);
  };

  /** Editing a field by hand after picking a customer means it's no longer
   *  exactly that customer's record — fall back to minting a fresh id. */
  const updateCustomerField = (patch: Partial<CustomerDraft>) => {
    setSelectedCustomerId(null);
    setCustomer((prev) => {
      const next = { ...prev, ...patch };
      if (displayNameAuto && ("firstName" in patch || "lastName" in patch)) {
        next.name = [next.firstName, next.lastName].filter((s) => s.trim()).join(" ");
      }
      return next;
    });
  };
  const onDisplayNameChange = (value: string) => {
    setDisplayNameAuto(false);
    updateCustomerField({ name: value });
  };
  const updateBillingAddress = (patch: Partial<AddressDraft>) => {
    setSelectedCustomerId(null);
    setBillingAddress((prev) => ({ ...prev, ...patch }));
  };
  const updateShippingAddress = (patch: Partial<AddressDraft>) => {
    setSelectedCustomerId(null);
    setShippingAddress((prev) => ({ ...prev, ...patch }));
  };
  const [invoiceDate, setInvoiceDate] = useState(
    invoice?.invoiceDate ?? new Date().toISOString().slice(0, 10),
  );
  const [term, setTerm] = useState<PaymentTerm>(invoice?.term ?? "net_30");
  const [customTermLabel, setCustomTermLabel] = useState(invoice?.customTermLabel ?? "");
  const [customTermDays, setCustomTermDays] = useState(
    invoice?.customTermDays != null ? String(invoice.customTermDays) : "",
  );
  // No UI to edit this anymore — preserved as-is so re-saving an invoice
  // that already had one doesn't wipe it out.
  const [salesTaxPct] = useState(String(invoice?.salesTaxPct ?? 0));
  const [note, setNote] = useState(invoice?.noteToCustomer ?? "");
  // No UI to edit this anymore — preserved as-is so re-saving an invoice
  // that already had one doesn't wipe it out.
  const [memo] = useState(invoice?.memoOnStatement ?? "");
  const [payInstr, setPayInstr] = useState(invoice?.paymentInstructions ?? "");

  // The letterhead shown in the Email/Payor/PDF preview tabs — fetched once;
  // falls back to a plain placeholder if the request hasn't resolved yet
  // (or fails) so the preview never crashes on a missing company name.
  const [companyDraft, setCompanyDraft] = useState<InvoiceDraftCompany>({
    name: "Your company",
    email: null,
    phone: null,
    website: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    logoSrc: null,
    emailFrom: null,
    bankName: null,
    routingNumber: null,
    accountNumber: null,
  });
  useEffect(() => {
    let cancelled = false;
    void getCompanyProfile().then((res) => {
      if (cancelled || !res.success || !res.data) return;
      setCompanyDraft({
        name: res.data.companyName,
        email: res.data.email,
        phone: res.data.phone,
        website: res.data.website,
        addressLine1: res.data.addressLine1,
        addressLine2: res.data.addressLine2,
        city: res.data.city,
        state: res.data.state,
        postalCode: res.data.postalCode,
        country: res.data.country,
        logoSrc: res.data.hasLogo ? companyLogoSrc(res.data.updatedAt) : null,
        emailFrom: res.data.emailFrom,
        bankName: res.data.bankName,
        routingNumber: res.data.routingNumber,
        accountNumber: res.data.accountNumber,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // New invoice only — a preview of the number it'll get on save, so the
  // header/summary never sit blank while drafting. Not a reservation: the
  // real number is assigned atomically at create time and could differ if
  // another invoice is created first.
  const [predictedInvoiceNo, setPredictedInvoiceNo] = useState<string | null>(null);
  useEffect(() => {
    if (invoice) return;
    let cancelled = false;
    void getNextInvoiceNo().then((res) => {
      if (cancelled || !res.success || !res.data) return;
      setPredictedInvoiceNo(res.data.invoiceNo);
    });
    return () => {
      cancelled = true;
    };
  }, [invoice]);
  // Puts the number next to the TopBar's route title ("New invoice ·
  // INV-111") instead of repeating it in the in-page heading below.
  useSetTopBarSuffix(invoice?.invoiceNo ?? predictedInvoiceNo ?? null);

  const [rows, setRows] = useState<RowState[]>(
    invoice
      ? invoice.lineItems.map((li) => ({
          key: newKey(),
          product: li.product,
          month: li.month ?? currentMonthName(),
          description: li.description ?? "",
          qty: String(li.qty),
          rate: (li.rateCents / 100).toString(),
        }))
      : [toRow()],
  );
  // Which bottom-bar action is in flight, if any — drives the two buttons'
  // disabled/spinner state independently so only the clicked one animates.
  const [savingMode, setSavingMode] = useState<"save" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(
    invoice?.attachments ?? [],
  );
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  // Bumped after every selection to force React to remount a fresh <input>
  // (not just clear .value) — the reliable fix for "re-picking the same
  // file, or picking again right after removing it, does nothing."
  const [fileInputKey, setFileInputKey] = useState(0);
  // Staged (not yet uploaded) files preview instantly from the local `File`
  // object itself — no server round-trip needed, unlike already-uploaded
  // attachments (AttachmentList), which have to fetch their bytes.
  const [previewingStaged, setPreviewingStaged] = useState<File | null>(null);
  const [previewingStagedUrl, setPreviewingStagedUrl] = useState<string | null>(null);

  // Editing an invoice that already exists: upload right away (same
  // immediacy as removing an existing attachment) instead of staging —
  // staging is only needed pre-creation, when there's no invoice id yet to
  // upload against.
  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);
    setFileInputKey((k) => k + 1);

    if (editing && invoice) {
      setAttachmentError(null);
      setAttachmentUploading(true);
      const res = await uploadAttachments(invoice.id, picked);
      setAttachmentUploading(false);
      if (!res.success || !res.data) {
        setAttachmentError(res.error ?? "Failed to upload the attachment.");
        return;
      }
      const uploaded = res.data;
      setExistingAttachments((prev) => [...prev, ...uploaded]);
      return;
    }

    setStagedFiles((prev) => [...prev, ...picked]);
  };
  const removeStagedFile = (index: number) =>
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));

  const openStagedPreview = (file: File) => {
    setPreviewingStaged(file);
    setPreviewingStagedUrl(URL.createObjectURL(file));
  };
  const closeStagedPreview = () => {
    setPreviewingStaged(null);
    setPreviewingStagedUrl(null);
  };
  const downloadStagedFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };
  // Revokes the previous preview URL whenever it's replaced (switching
  // files, closing) or on unmount — same pattern as AttachmentList.
  useEffect(() => {
    return () => {
      if (previewingStagedUrl) URL.revokeObjectURL(previewingStagedUrl);
    };
  }, [previewingStagedUrl]);

  const rateFor = (product: string) =>
    billRates.find((r) => r.product === product)?.rateCents ?? null;

  const updateRow = (key: string, patch: Partial<RowState>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const onProductChange = (key: string, product: string) => {
    const cents = rateFor(product);
    updateRow(key, { product, ...(cents !== null ? { rate: (cents / 100).toString() } : {}) });
  };

  const { lineTotals, subtotal, taxCents, total } = useMemo(() => {
    const lineTotals = rows.map((r) => {
      const qty = Number.parseFloat(r.qty) || 0;
      const rate = rateTextToCents(r.rate) ?? 0;
      return round(qty * rate);
    });
    const subtotal = lineTotals.reduce((s, n) => s + n, 0);
    const pct = Number.parseFloat(salesTaxPct) || 0;
    const taxCents = round((subtotal * pct) / 100);
    return { lineTotals, subtotal, taxCents, total: subtotal + taxCents };
  }, [rows, salesTaxPct]);

  const dueDate = useMemo(() => {
    const d = new Date(`${invoiceDate}T00:00:00Z`);
    const offset =
      term === "custom" ? Number.parseInt(customTermDays, 10) || 0 : FIXED_TERM_DAYS[term];
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  }, [invoiceDate, term, customTermDays]);

  const draftForPreview: InvoiceDraft = useMemo(
    () => ({
      invoiceNo: invoice?.invoiceNo ?? predictedInvoiceNo ?? "DRAFT",
      company: companyDraft,
      customerName: customer.name.trim() || "Customer",
      customerCompany: customer.company.trim() || null,
      customerEmail: customer.primaryEmail.trim(),
      customerBillingAddress: addressPayload(billingAddress),
      customerShippingAddress: shipSameAsBilling
        ? addressPayload(billingAddress)
        : addressPayload(shippingAddress),
      invoiceDate,
      dueDate,
      termLabel: term === "custom" ? customTermLabel.trim() || "Custom" : TERM_LABEL[term],
      lineItems: rows.map((r, i) => ({
        product: r.product.trim() || "—",
        month: r.month || null,
        description: r.description.trim(),
        qty: Number.parseFloat(r.qty) || 0,
        rateCents: rateTextToCents(r.rate) ?? 0,
        amountCents: lineTotals[i] ?? 0,
      })),
      subtotalCents: subtotal,
      taxCents,
      totalCents: total,
      salesTaxPct: Number.parseFloat(salesTaxPct) || 0,
      note: note.trim(),
      paymentInstructions: payInstr.trim(),
    }),
    [
      invoice,
      predictedInvoiceNo,
      companyDraft,
      customer,
      billingAddress,
      shippingAddress,
      shipSameAsBilling,
      invoiceDate,
      dueDate,
      term,
      customTermLabel,
      rows,
      lineTotals,
      subtotal,
      taxCents,
      total,
      salesTaxPct,
      note,
      payInstr,
    ],
  );

  /** Validates + creates/updates the invoice (and uploads any staged
   *  attachments). Leaves `savingMode` set to whatever the caller passed in
   *  on success — the caller clears it once its own follow-up work (if any)
   *  is done — so a caller that needs one more await (e.g. the submit
   *  transition) doesn't flash the buttons back to idle in between. Updates
   *  an already-persisted invoice (edit mode, or a prior call this session —
   *  see `pendingInvoiceId`) rather than creating a second one. Returns the
   *  saved invoice (its real `invoiceNo` is only known after this resolves,
   *  for a brand-new invoice), or null (with `error` already set) on failure. */
  const persistInvoice = async (mode: "save" | "submit"): Promise<Invoice | null> => {
    setError(null);
    if (!customer.name.trim()) {
      setError("Customer name is required.");
      return null;
    }
    if (!customer.primaryEmail.trim()) {
      setError("Primary email is required.");
      return null;
    }
    if (term === "custom" && !customTermLabel.trim()) {
      setError("Enter a label for the custom term.");
      return null;
    }
    if (term === "custom" && !(Number.parseInt(customTermDays, 10) > 0)) {
      setError("Enter the number of days until due for the custom term.");
      return null;
    }
    if (rows.length === 0) {
      setError("Add at least one line item.");
      return null;
    }
    if (existingAttachments.length === 0 && stagedFiles.length === 0) {
      setError("At least one attachment is required.");
      return null;
    }

    const billingAddressPayload = addressPayload(billingAddress);
    const shippingAddressPayload = shipSameAsBilling
      ? billingAddressPayload
      : addressPayload(shippingAddress);

    const parent = customer.isSubCustomer
      ? customers.find((c) => c.id === customer.parentCustomerId)
      : undefined;

    const payload: CreateInvoicePayload = {
      customer: {
        ...(selectedCustomerId ? { id: selectedCustomerId } : {}),
        title: customer.title.trim() || null,
        firstName: customer.firstName.trim() || null,
        middleName: customer.middleName.trim() || null,
        lastName: customer.lastName.trim() || null,
        suffix: customer.suffix.trim() || null,
        name: customer.name.trim(),
        company: customer.company.trim() || null,
        primaryEmail: customer.primaryEmail.trim(),
        secondaryEmail: customer.secondaryEmail.trim() || null,
        cc: customer.cc.trim() || null,
        bcc: customer.bcc.trim() || null,
        phone: customer.phone.trim() || null,
        mobile: customer.mobile.trim() || null,
        fax: customer.fax.trim() || null,
        otherContact: customer.otherContact.trim() || null,
        website: customer.website.trim() || null,
        nameToPrintOnChecks: customer.nameToPrintOnChecks.trim() || null,
        isSubCustomer: customer.isSubCustomer && Boolean(parent),
        parentCustomerId: parent?.id ?? null,
        parentCustomerName: parent ? displayNameWithParent(parent) : null,
        billingAddress: billingAddressPayload,
        shippingAddress: shippingAddressPayload,
      },
      invoiceDate,
      term,
      customTermLabel: term === "custom" ? customTermLabel.trim() : null,
      customTermDays: term === "custom" ? Number.parseInt(customTermDays, 10) || null : null,
      salesTaxPct: Number.parseFloat(salesTaxPct) || 0,
      paymentInstructions: payInstr.trim() || null,
      noteToCustomer: note.trim() || null,
      memoOnStatement: memo.trim() || null,
      lineItems: rows.map((r) => ({
        product: r.product.trim(),
        month: r.month || null,
        description: r.description.trim() || null,
        qty: Number.parseFloat(r.qty) || 0,
        rateCents: rateTextToCents(r.rate),
      })),
    };

    const targetId = invoice?.id ?? pendingInvoiceId;
    setSavingMode(mode);
    const res = targetId ? await updateInvoice(targetId, payload) : await createInvoice(payload);

    if (!res.success || !res.data) {
      setSavingMode(null);
      setError(res.error ?? "Something went wrong.");
      return null;
    }
    // Now-confirmed real number replaces the prediction everywhere it's
    // used (header, summary, default Subject) — closes the small window
    // where a stale prediction could otherwise linger after this resolves.
    setPredictedInvoiceNo(res.data.invoiceNo);
    if (!targetId) setPendingInvoiceId(res.data.id);

    if (stagedFiles.length > 0) {
      const up = await uploadAttachments(res.data.id, stagedFiles);
      if (!up.success) {
        setSavingMode(null);
        setSavedInvoiceId(res.data.id);
        setError(
          `Invoice saved, but the attachment(s) failed to upload (${up.error ?? "unknown error"}). Open the invoice to retry.`,
        );
        return null;
      }
    }

    return res.data;
  };

  /** Bottom-bar "Save" — persists as Draft, no email. Deliberately stays
   *  on this page (no redirect) so drafting isn't interrupted; the bottom
   *  bar's "Continue to invoice →" link is there whenever the user wants
   *  to jump over to it instead. */
  const saveOnly = async () => {
    const saved = await persistInvoice("save");
    setSavingMode(null);
    if (!saved) return;
  };

  /** Review-split's "Confirm and submit" — persists AND transitions
   *  Draft → Submitted (the same transition `InvoiceActions` triggers on
   *  the detail page) in one step, carrying the edited Subject — the
   *  compose fields live right here alongside the PDF/Email preview, so
   *  there's no separate review-then-send step to click through. */
  const confirmSubmit = async () => {
    const saved = await persistInvoice("submit");
    if (!saved) {
      setSavingMode(null);
      return;
    }
    const res = await transitionInvoice(saved.id, "submitted", undefined, emailSubject.trim());
    setSavingMode(null);
    if (!res.success) {
      setSavedInvoiceId(saved.id);
      setError(
        `Invoice saved as Draft, but submitting it failed (${res.error ?? "unknown error"}). Open the invoice to retry.`,
      );
      return;
    }
    router.push(`/portal/invoices/${saved.id}`);
    router.refresh();
  };

  /** "Review and submit" — enters the review screen; fills in the default
   *  Subject the first time only (a brand-new invoice doesn't have a real
   *  number yet, so this uses the predicted one — see `predictedInvoiceNo`).
   *  Never overwrites an edit the user already made after stepping back. */
  const openReview = () => {
    if (!emailSubject.trim()) {
      const invoiceNo = invoice?.invoiceNo ?? predictedInvoiceNo ?? "";
      setEmailSubject(`Your invoice is ready — ${invoiceNo} from ${companyDraft.name}`);
    }
    setReviewing(true);
    window.scrollTo(0, 0);
  };

  /** Rasterizes the PDF preview and downloads it directly — no browser
   *  print dialog, no intermediate page. */
  const downloadPdf = async () => {
    if (!pdfRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const invoiceNo = invoice?.invoiceNo ?? predictedInvoiceNo ?? "invoice";
      await downloadElementAsPdf(pdfRef.current, `${invoiceNo}.pdf`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const PREVIEW_TABS: { readonly key: PreviewTab; readonly label: string }[] = [
    { key: "edit", label: invoice ? "Edit" : "New" },
    { key: "email", label: "Email view" },
    { key: "payor", label: "Payor view" },
    { key: "pdf", label: "PDF view" },
  ];

  const showFullCustomerForm = editing || !selectedCustomerId || showCustomerDetails;
  // Nothing to defer if there are no existing customers to pick from in the
  // first place — go straight to the full form rather than stranding the
  // user on a picker with nothing in it.
  const showCustomerBody = editing || customerChosen || customers.length === 0;
  // Line items/Attachments/Notes stay hidden not just before any customer is
  // chosen, but for as long as the full customer form is up — creating a
  // brand-new customer or actively re-editing one via "Edit Customer" — and
  // only reveal once that customer is saved and the view collapses back to
  // the compact "Bill to" summary. Always shown while editing an existing
  // invoice (unaffected — that flow never uses this customer-creation step).
  const showRestOfInvoice = editing || (showCustomerBody && !showFullCustomerForm);
  const ccBccCount = Number(Boolean(customer.cc.trim())) + Number(Boolean(customer.bcc.trim()));
  // Draft → Submitted is the only path the "Review and submit" bottom-bar
  // action drives. A rejected invoice can only go rejected → draft (its own
  // "Resubmit" action on the detail page) — submitting it directly isn't a
  // legal transition, so the button is hidden rather than surfacing a
  // guaranteed-to-fail API error.
  const canSubmitFromHere = !invoice || invoice.status === "draft";

  return (
    <>
      <p className="muted-3 no-print" style={{ fontSize: "0.78rem", margin: "0 0 0.35rem" }}>
        Business info:{" "}
        <strong style={{ color: "var(--portal-text)", fontWeight: 600 }}>{companyDraft.name}</strong>
      </p>
      <div className="row between no-print" style={{ marginBottom: "0.6rem" }}>
        <h1 className="text-display invoice-form-title" style={{ margin: 0 }}>
          {invoice ? "Invoice" : "New Invoice"}
        </h1>
      </div>

      {reviewing ? (
        <>
          <div className="row between no-print" style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setReviewing(false);
                window.scrollTo(0, 0);
              }}
            >
              <ArrowLeft size={14} /> Back to edit
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={downloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={14} className="spin" /> Preparing…
                </>
              ) : (
                <>
                  <Download size={14} /> Download PDF
                </>
              )}
            </button>
          </div>
          <div className="review-split no-print">
            <section className="card pad" style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
                <Mail size={16} className="muted-3" />
                <span className="muted-3" style={{ fontSize: "0.78rem" }}>
                  Email your invoice
                </span>
              </div>
              <Field label="From">
                <input
                  className="input input-readonly"
                  value={
                    companyDraft.emailFrom ??
                    (companyDraft.email
                      ? `${companyDraft.name} <${companyDraft.email}>`
                      : companyDraft.name)
                  }
                  readOnly
                  tabIndex={-1}
                />
              </Field>
              <div style={{ marginTop: "0.85rem" }}>
                <Field label="To">
                  <input
                    className="input input-readonly"
                    value={customer.primaryEmail}
                    readOnly
                    tabIndex={-1}
                  />
                </Field>
              </div>
              {ccBccCount > 0 && (
                <p className="muted-3" style={{ fontSize: "0.78rem", marginTop: "0.4rem" }}>
                  {ccBccCount} Cc/Bcc also on this invoice will receive it too.
                </p>
              )}
              <div style={{ marginTop: "0.85rem" }}>
                <Field label="Subject">
                  <input
                    className="input"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </Field>
              </div>
              <div style={{ marginTop: "0.85rem" }}>
                <Field label="Message">
                  <textarea
                    className="textarea"
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="A personal note included in the email, under the invoice details."
                  />
                </Field>
              </div>
            </section>
            <div className="review-preview-scroll" style={{ flex: 1, minWidth: 0 }}>
              <InvoicePreview view="email" draft={draftForPreview} />
            </div>
          </div>
          <div ref={pdfRef} style={{ marginTop: "1.5rem" }}>
            <InvoicePreview view="pdf" draft={draftForPreview} />
          </div>
        </>
      ) : (
        <>
          <div className="row" style={{ gap: "0.25rem", marginBottom: "1rem" }}>
            {PREVIEW_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setPreviewTab(t.key)}
                className="btn btn-ghost"
                style={
                  previewTab === t.key
                    ? { color: "var(--portal-accent-deep)", background: "var(--portal-accent-soft)" }
                    : undefined
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="form-grid">
            <div className="stack">
              {previewTab !== "edit" ? (
                <InvoicePreview view={previewTab} draft={draftForPreview} />
              ) : (
                <>
                  {/* Customer — Report Sample 2 */}
                  <section className="card pad">
                    <h2 className="section-title">Customer</h2>
                    {!editing && customers.length > 0 ? (
                      <div className="field customer-picker">
                        <span className="label">Existing customer</span>
                        <div className="row" style={{ gap: "0.5rem" }}>
                          <CustomerPicker
                            customers={customers}
                            selectedCustomerId={selectedCustomerId}
                            onPick={onPickCustomer}
                            onCustomerDeleted={handleCustomerDeleted}
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="New customer"
                            title="New customer"
                            onClick={() => onPickCustomer(NEW_CUSTOMER_VALUE)}
                          >
                            <UserPlus size={15} />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {showCustomerBody &&
                      (!showFullCustomerForm ? (
                        <div style={{ marginTop: "0.5rem" }}>
                          <p className="muted-3" style={{ fontSize: "0.85rem" }}>
                            {customer.primaryEmail}
                          </p>
                          {ccBccCount > 0 && (
                            <p className="muted-3" style={{ fontSize: "0.8rem" }}>
                              {ccBccCount} Cc/Bcc
                            </p>
                          )}
                          <div style={{ marginTop: "0.7rem" }}>
                            <span className="label">Bill to</span>
                            <div
                              className="surface rounded-xl"
                              style={{
                                border: "1px solid var(--portal-border)",
                                padding: "0.75rem 0.9rem",
                                fontSize: "0.85rem",
                                lineHeight: 1.5,
                              }}
                            >
                              <strong>{customer.company.trim() || customer.name}</strong>
                              {billingAddress.line1 && <div>{billingAddress.line1}</div>}
                              {billingAddress.line2 && <div>{billingAddress.line2}</div>}
                              {(billingAddress.city ||
                                billingAddress.state ||
                                billingAddress.postalCode) && (
                                <div>
                                  {[
                                    billingAddress.city,
                                    billingAddress.state,
                                    billingAddress.postalCode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </div>
                              )}
                              {billingAddress.country && <div>{billingAddress.country}</div>}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="vs-link-btn"
                            style={{ marginTop: "0.6rem" }}
                            onClick={() => setShowCustomerDetails(true)}
                          >
                            Edit Customer
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3
                            className="section-subtitle"
                            style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
                          >
                            Name and contact
                          </h3>
                          <div className="field-grid-5">
                            <Field label="Title">
                              <input
                                className="input"
                                value={customer.title}
                                onChange={(e) => updateCustomerField({ title: e.target.value })}
                                placeholder="Mr. / Ms. / Dr."
                              />
                            </Field>
                            <Field label="First name">
                              <input
                                className="input"
                                value={customer.firstName}
                                onChange={(e) => updateCustomerField({ firstName: e.target.value })}
                              />
                            </Field>
                            <Field label="Middle name">
                              <input
                                className="input"
                                value={customer.middleName}
                                onChange={(e) =>
                                  updateCustomerField({ middleName: e.target.value })
                                }
                              />
                            </Field>
                            <Field label="Last name">
                              <input
                                className="input"
                                value={customer.lastName}
                                onChange={(e) => updateCustomerField({ lastName: e.target.value })}
                              />
                            </Field>
                            <Field label="Suffix">
                              <input
                                className="input"
                                value={customer.suffix}
                                onChange={(e) => updateCustomerField({ suffix: e.target.value })}
                                placeholder="Jr. / III"
                              />
                            </Field>
                          </div>

                          <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                            <Field label="Company name">
                              <input
                                className="input"
                                value={customer.company}
                                onChange={(e) => updateCustomerField({ company: e.target.value })}
                                placeholder="Client company"
                              />
                            </Field>
                            <Field label="Customer display name *">
                              <input
                                className="input"
                                value={customer.name}
                                onChange={(e) => onDisplayNameChange(e.target.value)}
                                placeholder="Shown on invoices and the customer picker"
                              />
                            </Field>
                          </div>

                          <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                            <Field label="Primary email *">
                              <input
                                className="input"
                                type="email"
                                value={customer.primaryEmail}
                                onChange={(e) =>
                                  updateCustomerField({ primaryEmail: e.target.value })
                                }
                                placeholder="ap@client.com"
                                required
                              />
                            </Field>
                            <Field label="Phone number">
                              <input
                                className="input"
                                value={customer.phone}
                                onChange={(e) => updateCustomerField({ phone: e.target.value })}
                                placeholder="+1 …"
                              />
                            </Field>
                          </div>

                          <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                            <Field label="Cc">
                              <input
                                className="input"
                                type="email"
                                value={customer.cc}
                                onChange={(e) => updateCustomerField({ cc: e.target.value })}
                              />
                            </Field>
                            <Field label="Bcc">
                              <input
                                className="input"
                                type="email"
                                value={customer.bcc}
                                onChange={(e) => updateCustomerField({ bcc: e.target.value })}
                              />
                            </Field>
                          </div>

                          <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                            <Field label="Mobile number">
                              <input
                                className="input"
                                value={customer.mobile}
                                onChange={(e) => updateCustomerField({ mobile: e.target.value })}
                              />
                            </Field>
                            <Field label="Fax">
                              <input
                                className="input"
                                value={customer.fax}
                                onChange={(e) => updateCustomerField({ fax: e.target.value })}
                              />
                            </Field>
                          </div>

                          <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                            <Field label="Secondary email">
                              <input
                                className="input"
                                type="email"
                                value={customer.secondaryEmail}
                                onChange={(e) =>
                                  updateCustomerField({ secondaryEmail: e.target.value })
                                }
                                placeholder="billing@client.com (optional)"
                              />
                            </Field>
                            <Field label="Other">
                              <input
                                className="input"
                                value={customer.otherContact}
                                onChange={(e) =>
                                  updateCustomerField({ otherContact: e.target.value })
                                }
                              />
                            </Field>
                          </div>

                          <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                            <Field label="Website">
                              <input
                                className="input"
                                value={customer.website}
                                onChange={(e) => updateCustomerField({ website: e.target.value })}
                                placeholder="https://…"
                              />
                            </Field>
                            <Field label="Name to print on checks">
                              <input
                                className="input"
                                value={customer.nameToPrintOnChecks}
                                onChange={(e) =>
                                  updateCustomerField({ nameToPrintOnChecks: e.target.value })
                                }
                              />
                            </Field>
                          </div>

                          <label
                            className="row"
                            style={{ gap: "0.5rem", marginTop: "0.85rem", cursor: "pointer" }}
                          >
                            <input
                              type="checkbox"
                              checked={customer.isSubCustomer}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateCustomerField({
                                  isSubCustomer: checked,
                                  ...(checked ? {} : { parentCustomerId: "" }),
                                });
                              }}
                            />
                            <span className="muted">Is a sub-customer</span>
                          </label>
                          {customer.isSubCustomer && (
                            <div style={{ marginTop: "0.6rem" }}>
                              <Field label="Parent customer">
                                <select
                                  className="select"
                                  value={customer.parentCustomerId}
                                  onChange={(e) =>
                                    updateCustomerField({ parentCustomerId: e.target.value })
                                  }
                                >
                                  <option value="">Select a parent customer…</option>
                                  {customers
                                    .filter((c) => c.id !== selectedCustomerId)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {displayNameWithParent(c)}
                                        {c.company ? ` — ${c.company}` : ""}
                                      </option>
                                    ))}
                                </select>
                              </Field>
                              {customers.length === 0 && (
                                <p className="muted-3" style={{ marginTop: "0.4rem" }}>
                                  No other customers yet to nest this one under.
                                </p>
                              )}
                            </div>
                          )}

                          <h3 className="section-subtitle">Billing address</h3>
                          <div className="field-grid-2">
                            <Field label="Address line 1">
                              <input
                                className="input"
                                value={billingAddress.line1}
                                onChange={(e) => updateBillingAddress({ line1: e.target.value })}
                                placeholder="Street address"
                              />
                            </Field>
                            <Field label="Address line 2">
                              <input
                                className="input"
                                value={billingAddress.line2}
                                onChange={(e) => updateBillingAddress({ line2: e.target.value })}
                                placeholder="Suite / floor (optional)"
                              />
                            </Field>
                          </div>
                          <div className="field-grid-3" style={{ marginTop: "0.85rem" }}>
                            <Field label="City">
                              <input
                                className="input"
                                value={billingAddress.city}
                                onChange={(e) => updateBillingAddress({ city: e.target.value })}
                              />
                            </Field>
                            <Field label="State">
                              <input
                                className="input"
                                value={billingAddress.state}
                                onChange={(e) => updateBillingAddress({ state: e.target.value })}
                              />
                            </Field>
                            <Field label="Postal code">
                              <input
                                className="input"
                                value={billingAddress.postalCode}
                                onChange={(e) =>
                                  updateBillingAddress({ postalCode: e.target.value })
                                }
                              />
                            </Field>
                          </div>
                          <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                            <Field label="Country">
                              <input
                                className="input"
                                value={billingAddress.country}
                                onChange={(e) => updateBillingAddress({ country: e.target.value })}
                              />
                            </Field>
                          </div>

                          <h3 className="section-subtitle">Shipping address</h3>
                          <label
                            className="row"
                            style={{ gap: "0.5rem", marginBottom: "0.85rem", cursor: "pointer" }}
                          >
                            <input
                              type="checkbox"
                              checked={shipSameAsBilling}
                              onChange={(e) => setShipSameAsBilling(e.target.checked)}
                            />
                            <span className="muted">Same as billing address</span>
                          </label>
                          {!shipSameAsBilling && (
                            <>
                              <div className="field-grid-2">
                                <Field label="Address line 1">
                                  <input
                                    className="input"
                                    value={shippingAddress.line1}
                                    onChange={(e) =>
                                      updateShippingAddress({ line1: e.target.value })
                                    }
                                    placeholder="Street address"
                                  />
                                </Field>
                                <Field label="Address line 2">
                                  <input
                                    className="input"
                                    value={shippingAddress.line2}
                                    onChange={(e) =>
                                      updateShippingAddress({ line2: e.target.value })
                                    }
                                    placeholder="Suite / floor (optional)"
                                  />
                                </Field>
                              </div>
                              <div className="field-grid-3" style={{ marginTop: "0.85rem" }}>
                                <Field label="City">
                                  <input
                                    className="input"
                                    value={shippingAddress.city}
                                    onChange={(e) =>
                                      updateShippingAddress({ city: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field label="State">
                                  <input
                                    className="input"
                                    value={shippingAddress.state}
                                    onChange={(e) =>
                                      updateShippingAddress({ state: e.target.value })
                                    }
                                  />
                                </Field>
                                <Field label="Postal code">
                                  <input
                                    className="input"
                                    value={shippingAddress.postalCode}
                                    onChange={(e) =>
                                      updateShippingAddress({ postalCode: e.target.value })
                                    }
                                  />
                                </Field>
                              </div>
                              <div className="field-grid-2" style={{ marginTop: "0.85rem" }}>
                                <Field label="Country">
                                  <input
                                    className="input"
                                    value={shippingAddress.country}
                                    onChange={(e) =>
                                      updateShippingAddress({ country: e.target.value })
                                    }
                                  />
                                </Field>
                              </div>
                            </>
                          )}

                          <div className="row" style={{ gap: "0.6rem", marginTop: "1.1rem" }}>
                            {editingCustomerId && (
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={cancelCustomerEdit}
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={saveCustomer}
                              disabled={savingCustomer}
                            >
                              {savingCustomer ? (
                                <>
                                  <Loader2 size={15} className="spin" /> Saving…
                                </>
                              ) : (
                                "Save customer"
                              )}
                            </button>
                          </div>
                          {customerError && (
                            <p className="inline-error" style={{ marginTop: "0.6rem" }}>
                              {customerError}
                            </p>
                          )}
                        </>
                      ))}
                  </section>

                  {showRestOfInvoice && (
                    <>
                      {/* Line items — Report Sample 4 */}
                      <section className="card pad">
                        <div className="row between" style={{ marginBottom: "0.8rem" }}>
                          <h2 className="section-title" style={{ margin: 0 }}>
                            Line items
                          </h2>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setRows((prev) => [...prev, toRow()])}
                          >
                            <Plus size={15} /> Add line
                          </button>
                        </div>

                        {/* `.table-wrap` contains any overflow to a scrollbar
                         *  inside this card — without it, a narrow container
                         *  forces the whole page wider instead (CSS Grid
                         *  won't shrink a track below its own minmax floor). */}
                        <div className="table-wrap">
                          <div className="lines-head">
                            <span>Employee name *</span>
                            <span>Month</span>
                            <span>Qty *</span>
                            <span>Rate</span>
                            <span className="right">Amount</span>
                            <span />
                          </div>

                          <AnimatePresence initial={false}>
                            {rows.map((row, i) => (
                              <motion.div
                                key={row.key}
                                layout
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                                className="line-row"
                              >
                                <div className="line-cell">
                                  <input
                                    className="input"
                                    value={row.product}
                                    onChange={(e) => onProductChange(row.key, e.target.value)}
                                    placeholder="Employee name"
                                  />
                                  <input
                                    className="input input-sub"
                                    value={row.description}
                                    onChange={(e) =>
                                      updateRow(row.key, { description: e.target.value })
                                    }
                                    placeholder="Description (optional)"
                                  />
                                </div>
                                <select
                                  className="select"
                                  value={row.month}
                                  onChange={(e) => updateRow(row.key, { month: e.target.value })}
                                >
                                  {MONTH_NAMES.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  className="input"
                                  type="text"
                                  inputMode="decimal"
                                  value={row.qty}
                                  onChange={(e) => {
                                    if (QTY_TEXT.test(e.target.value))
                                      updateRow(row.key, { qty: e.target.value });
                                  }}
                                />
                                <input
                                  className="input tnum"
                                  type="text"
                                  inputMode="decimal"
                                  value={row.rate}
                                  onChange={(e) => {
                                    if (MONEY_TEXT.test(e.target.value))
                                      updateRow(row.key, { rate: e.target.value });
                                  }}
                                  placeholder="0.00"
                                />
                                <div className="right tnum strong line-amount">
                                  {money(lineTotals[i] ?? 0)}
                                </div>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  aria-label="Remove line"
                                  onClick={() =>
                                    setRows((prev) => prev.filter((r) => r.key !== row.key))
                                  }
                                  disabled={rows.length === 1}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </section>

                      {/* Attachments */}
                      <section className="card pad">
                        <h2 className="section-title">Attachments *</h2>

                        {existingAttachments.length > 0 && (
                          <div style={{ marginBottom: "0.85rem" }}>
                            <AttachmentList
                              invoiceId={invoice?.id ?? ""}
                              attachments={existingAttachments}
                              removable
                              onRemoved={(id) =>
                                setExistingAttachments((prev) => prev.filter((a) => a.id !== id))
                              }
                            />
                          </div>
                        )}

                        {stagedFiles.length > 0 && (
                          <ul className="attachment-list" style={{ marginBottom: "0.85rem" }}>
                            {stagedFiles.map((f, i) => (
                              <li key={`${f.name}-${i}`} className="attachment-row">
                                <Paperclip size={14} className="muted-3" />
                                <button
                                  type="button"
                                  className="attachment-name"
                                  onClick={() => openStagedPreview(f)}
                                  title="View"
                                >
                                  {f.name}
                                </button>
                                <span className="muted-3 attachment-size">
                                  {formatBytes(f.size)}
                                </span>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => openStagedPreview(f)}
                                  aria-label={`View ${f.name}`}
                                  title="View"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => downloadStagedFile(f)}
                                  aria-label={`Download ${f.name}`}
                                  title="Download"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  aria-label={`Remove ${f.name}`}
                                  onClick={() => removeStagedFile(i)}
                                >
                                  <X size={14} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {attachmentError && (
                          <p className="inline-error" style={{ marginBottom: "0.6rem" }}>
                            {attachmentError}
                          </p>
                        )}

                        <input
                          key={fileInputKey}
                          ref={fileInputRef}
                          type="file"
                          multiple
                          style={{ display: "none" }}
                          onChange={(e) => void onFilesSelected(e.target.files)}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={attachmentUploading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {attachmentUploading ? (
                            <Loader2 size={15} className="spin" />
                          ) : (
                            <Paperclip size={15} />
                          )}
                          {attachmentUploading ? "Uploading…" : "Attach file"}
                        </button>
                        <p className="muted-3" style={{ marginTop: "0.6rem" }}>
                          Any file type up to 15 MB — receipts, signed SOWs, spreadsheets, images.
                        </p>
                      </section>

                      <AttachmentPreviewModal
                        attachment={
                          previewingStaged && {
                            filename: previewingStaged.name,
                            mimeType: previewingStaged.type,
                          }
                        }
                        url={previewingStagedUrl}
                        loading={false}
                        error={null}
                        onDownload={() => previewingStaged && downloadStagedFile(previewingStaged)}
                        onClose={closeStagedPreview}
                      />

                      {/* Footer meta — Report Sample 5 */}
                      <section className="card pad">
                        <h2 className="section-title">Notes &amp; instructions</h2>
                        <Field label="Payment instructions">
                          <textarea
                            className="textarea"
                            rows={2}
                            value={payInstr}
                            onChange={(e) => setPayInstr(e.target.value)}
                          />
                        </Field>
                        <div style={{ marginTop: "0.85rem" }}>
                          <Field label="Note to customer (on invoice)">
                            <textarea
                              className="textarea"
                              rows={2}
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                            />
                          </Field>
                        </div>
                      </section>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Sticky live summary */}
            <aside className="summary-rail">
              <div className="card pad summary-card">
                <h2 className="section-title">Summary</h2>
                <div className="sum-row">
                  <span className="muted">Subtotal</span>
                  <span className="tnum strong">
                    <AnimatedNumber value={subtotal} format={money} durationMs={450} />
                  </span>
                </div>
                <div className="sum-divider" />

                <div className="stack" style={{ gap: "0.75rem", margin: "0.2rem 0 0.6rem" }}>
                  <Field label="Invoice no.">
                    <input
                      className="input input-readonly"
                      value={invoice?.invoiceNo ?? predictedInvoiceNo ?? "Assigned on save"}
                      readOnly
                      tabIndex={-1}
                    />
                  </Field>
                  <Field label="Terms">
                    <select
                      className="select"
                      value={term}
                      onChange={(e) => setTerm(e.target.value as PaymentTerm)}
                    >
                      {TERMS.map((t) => (
                        <option key={t} value={t}>
                          {TERM_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Invoice date">
                    <input
                      className="input"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Due date (auto)">
                    <input
                      className="input input-readonly"
                      value={dueDate}
                      readOnly
                      tabIndex={-1}
                    />
                  </Field>

                  <AnimatePresence initial={false}>
                    {term === "custom" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "grid", gap: "0.75rem", overflow: "hidden" }}
                      >
                        <Field label="Custom term label *">
                          <input
                            className="input"
                            value={customTermLabel}
                            onChange={(e) => setCustomTermLabel(e.target.value)}
                            placeholder="e.g. Net 90"
                          />
                        </Field>
                        <Field label="Days until due *">
                          <input
                            className="input"
                            type="text"
                            inputMode="numeric"
                            value={customTermDays}
                            onChange={(e) => {
                              if (INT_TEXT.test(e.target.value)) setCustomTermDays(e.target.value);
                            }}
                            placeholder="90"
                          />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="sum-divider" />
                <div className="sum-row sum-total">
                  <span>Invoice total</span>
                  <span className="tnum">
                    <AnimatedNumber value={total} format={money} durationMs={600} />
                  </span>
                </div>
                <p className="muted-3 summary-note">
                  New invoices are saved as a <strong>Draft</strong> until you review and submit
                  them.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* Spacer — keeps the fixed action bar below from ever covering the
       *  last bit of scrollable content. */}
      <div style={{ height: "5.5rem" }} aria-hidden />

      {actionBarMounted &&
        createPortal(
          <div className="form-action-bar no-print">
            <div className="form-action-bar-inner">
              <div className="row" style={{ gap: "0.75rem", flex: 1, minWidth: 0 }}>
                <AnimatePresence>
                  {error && (
                    <motion.span
                      className="inline-error"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <AlertCircle size={15} />
                      {error}
                    </motion.span>
                  )}
                </AnimatePresence>
                {savedInvoiceId && (
                  <Link href={`/portal/invoices/${savedInvoiceId}`} className="btn btn-ghost btn-sm">
                    Continue to invoice →
                  </Link>
                )}
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={saveOnly}
                disabled={savingMode !== null}
              >
                {savingMode === "save" ? (
                  <>
                    <Loader2 size={16} className="spin" /> Saving…
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Save"
                )}
              </button>
              {canSubmitFromHere && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={reviewing ? confirmSubmit : openReview}
                  disabled={savingMode !== null}
                >
                  {savingMode === "submit" ? (
                    <>
                      <Loader2 size={16} className="spin" /> Submitting…
                    </>
                  ) : reviewing ? (
                    "Confirm and submit"
                  ) : (
                    "Review and submit"
                  )}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

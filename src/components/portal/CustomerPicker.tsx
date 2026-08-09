"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Search, Trash2, UserPlus } from "lucide-react";
import { deleteCustomer } from "@/lib/portal/api";
import { displayNameWithParent } from "@/lib/portal/format";
import type { Customer } from "@/lib/portal/types";

export const NEW_CUSTOMER_VALUE = "__new__";

function label(c: Customer): string {
  return displayNameWithParent(c) + (c.company ? ` — ${c.company}` : "");
}

/**
 * Searchable "existing customer" combobox — replaces a plain `<select>` so
 * a long customer list stays findable, and lets a customer be deleted
 * (trash icon per row) right from the picker. Deleting only removes the
 * master `invoice_customers` row: existing invoices embed their own
 * customer snapshot at save time, so they're never affected.
 */
export function CustomerPicker({
  customers,
  selectedCustomerId,
  onPick,
  onCustomerDeleted,
}: {
  readonly customers: readonly Customer[];
  readonly selectedCustomerId: string | null;
  readonly onPick: (id: string) => void;
  readonly onCustomerDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Every customer in this list came from the saved master table, so it
  // always has an id — this narrows away `Customer.id`'s `?` (only relevant
  // for not-yet-saved draft customers elsewhere in the app).
  const withId = customers.filter((c): c is Customer & { id: string } => Boolean(c.id));
  const selected = withId.find((c) => c.id === selectedCustomerId) ?? null;
  const filtered = withId.filter((c) =>
    label(c).toLowerCase().includes(query.trim().toLowerCase()),
  );

  const pick = (id: string) => {
    onPick(id);
    setOpen(false);
    setQuery("");
  };

  async function handleDelete(e: React.MouseEvent, customer: Customer & { id: string }) {
    e.stopPropagation();
    if (!window.confirm(`Delete ${label(customer)}? This can't be undone.`)) return;
    setDeletingId(customer.id);
    const res = await deleteCustomer(customer.id);
    setDeletingId(null);
    if (!res.success) {
      window.alert(res.error ?? "Failed to delete that customer.");
      return;
    }
    onCustomerDeleted(customer.id);
    if (customer.id === selectedCustomerId) onPick(NEW_CUSTOMER_VALUE);
  }

  return (
    <div className="combobox" ref={rootRef}>
      <button type="button" className="select combobox-trigger" onClick={() => setOpen((o) => !o)}>
        <span>{selected ? label(selected) : "+ New customer"}</span>
        <ChevronDown size={15} className="muted-3" />
      </button>

      {open && (
        <div className="combobox-panel">
          <div className="combobox-search">
            <Search size={14} className="muted-3" />
            <input
              autoFocus
              className="combobox-search-input"
              placeholder="Search customers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="combobox-list">
            <button
              type="button"
              className="combobox-row combobox-row-new"
              onClick={() => pick(NEW_CUSTOMER_VALUE)}
            >
              <UserPlus size={14} /> New customer
            </button>
            {filtered.length === 0 && (
              <div className="combobox-empty muted-3">No matching customers.</div>
            )}
            {filtered.map((c) => (
              <div key={c.id} className="combobox-row">
                <button type="button" className="combobox-row-label" onClick={() => pick(c.id)}>
                  {label(c)}
                </button>
                <button
                  type="button"
                  className="icon-btn combobox-row-delete"
                  aria-label={`Delete ${label(c)}`}
                  title="Delete customer"
                  disabled={deletingId === c.id}
                  onClick={(e) => void handleDelete(e, c)}
                >
                  {deletingId === c.id ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

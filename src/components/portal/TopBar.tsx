"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { useTopBarSuffix } from "./TopBarSuffix";

function titleFor(pathname: string): string {
  if (pathname === "/portal") return "Dashboard";
  if (pathname === "/portal/invoices/new") return "New invoice";
  if (pathname === "/portal/invoices") return "Invoices";
  if (pathname.startsWith("/portal/invoices/")) return "Invoice detail";
  if (pathname === "/portal/audit") return "Audit log";
  if (pathname === "/portal/settings/company") return "Company profile";
  return "Invoice Portal";
}

export function TopBar() {
  const pathname = usePathname();
  const suffix = useTopBarSuffix();
  return (
    <header className="vs-topbar">
      <motion.h1
        key={pathname}
        className="vs-topbar-title"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {titleFor(pathname)}
        {suffix && <span className="vs-topbar-title-suffix"> · {suffix}</span>}
      </motion.h1>

      <div className="vs-topbar-actions">
        <div className="vs-search">
          <Search size={15} />
          <input placeholder="Search invoices…" aria-label="Search invoices" />
        </div>
        <Link href="/portal/invoices/new" className="btn btn-primary">
          <Plus size={16} strokeWidth={2.4} />
          New invoice
        </Link>
      </div>
    </header>
  );
}

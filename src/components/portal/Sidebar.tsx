"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, Plus, ScrollText, Building2, LogOut } from "lucide-react";
import { logout } from "@/lib/portal/auth-client";
import { loadStoredMember } from "@/lib/portal/session";
import type { Member } from "@/lib/portal/types";

const NAV = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/portal/invoices", label: "Invoices", icon: FileText, exact: false },
  { href: "/portal/invoices/new", label: "New invoice", icon: Plus, exact: true },
  { href: "/portal/audit", label: "Audit log", icon: ScrollText, exact: true },
  { href: "/portal/settings/company", label: "Company profile", icon: Building2, exact: true },
];

function initialsFor(member: Member | null): string {
  if (!member) return "…";
  if (member.name) {
    const parts = member.name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  if (member.email) {
    return member.email.slice(0, 2).toUpperCase();
  }
  return "TP";
}

/** No external mutation ever fires between mount and login/logout (which both
 *  force a full navigation), so the store never needs to notify — the
 *  subscription is a no-op. */
function noopSubscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): Member | null {
  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const member = useSyncExternalStore(noopSubscribe, loadStoredMember, getServerSnapshot);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  async function onLogout() {
    await logout();
    router.replace("/portal/login");
    router.refresh();
  }

  return (
    <aside className="vs-sidebar">
      <div className="vs-brand">
        <span className="vs-brand-mark vs-brand-mark--logo">
          <Image src="/logo.jpg" alt="Tech Pursuit Systems" width={38} height={38} priority />
        </span>
        <span className="vs-brand-text">
          <strong>Tech Pursuit</strong>
          <small>Invoice Portal</small>
        </span>
      </div>

      <nav className="vs-nav">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} className={`vs-nav-item${active ? " is-active" : ""}`}>
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="vs-nav-active"
                  transition={{ type: "spring", stiffness: 480, damping: 34 }}
                />
              )}
              <Icon size={17} strokeWidth={2.1} className="vs-nav-icon" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="vs-sidebar-foot">
        <div className="vs-user">
          <span className="vs-user-avatar">{initialsFor(member)}</span>
          <span className="vs-user-meta">
            <strong>{member?.name ?? "Member"}</strong>
            <small>{member?.email ?? ""}</small>
          </span>
          <button type="button" className="vs-logout-btn" onClick={onLogout} aria-label="Sign out">
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}

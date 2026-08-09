"use client";

import { CircleDollarSign, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { moneyCompact } from "@/lib/portal/format";
import { Reveal } from "./Reveal";
import { StatCard } from "./StatCard";
import type { DashboardSummary } from "@/lib/portal/types";

/**
 * Client wrapper for the KPI tiles. Icons (component refs) and format
 * functions can't cross the server→client prop boundary, so the server page
 * passes only the plain `DashboardSummary` and the tiles are assembled here.
 */
export function DashboardTiles({ data }: { data: DashboardSummary }) {
  const paidPct =
    data.totalInvoiced > 0 ? Math.round((data.paidCents / data.totalInvoiced) * 100) : 0;

  return (
    <Reveal className="grid-tiles">
      <StatCard
        label="Total invoiced"
        value={data.totalInvoiced}
        format={moneyCompact}
        icon={CircleDollarSign}
        accent="#6d5cf6"
        sub="All statuses, filtered range"
      />
      <StatCard
        label="Outstanding"
        value={data.outstandingCents}
        format={moneyCompact}
        icon={Clock}
        accent="#3b5bc9"
        sub="Approved + submitted"
      />
      <StatCard
        label="Paid"
        value={data.paidCents}
        format={moneyCompact}
        icon={CheckCircle2}
        accent="#059669"
        sub={`${paidPct}% of invoiced value`}
      />
      <StatCard
        label="Overdue"
        value={data.overdueCents}
        format={moneyCompact}
        icon={AlertTriangle}
        accent="#e11d63"
        sub={`${data.overdueCount} invoice${data.overdueCount === 1 ? "" : "s"} past due`}
      />
    </Reveal>
  );
}

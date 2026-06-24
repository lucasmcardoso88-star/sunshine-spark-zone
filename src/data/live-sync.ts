import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  KPI_BY_YEAR,
  TRANSACTIONS_BY_YEAR,
  ALERTS,
  TARGETS_2025,
  type MonthlyKpi,
  type Transaction,
  type AlertEvent,
} from "@/data/mock";
import { MONTHS_PT } from "@/lib/format";

function emptyMonth(year: number, monthIndex: number): MonthlyKpi {
  return {
    year,
    monthIndex,
    monthLabel: MONTHS_PT[monthIndex],
    grossRevenue: 0, taxes: 0, commissions: 0, netRevenue: 0,
    operationalCosts: 0, commercialExpenses: 0, adminExpenses: 0, operationalExpenses: 0,
    financialIncome: 0, financialExpense: 0, grossProfit: 0, ebitda: 0,
    netProfit: 0, netMargin: 0, cashIn: 0, cashOut: 0, cashBalance: 0,
    accountsReceivable: 0, accountsPayable: 0,
  };
}

type DbStatus = "pending" | "paid" | "overdue" | "canceled";
const STATUS_MAP: Record<DbStatus, Transaction["status"]> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Atrasado",
  canceled: "Pendente",
};

async function loadKpis() {
  const { data } = await supabase.from("kpi_snapshots").select("*");
  if (!data) return;
  // Reset known years in place
  for (const year of Object.keys(KPI_BY_YEAR)) {
    const y = Number(year);
    const arr = KPI_BY_YEAR[y];
    for (let i = 0; i < arr.length; i++) arr[i] = emptyMonth(y, i);
  }
  // Aggregate across companies per (year, month)
  for (const row of data) {
    const yearArr = KPI_BY_YEAR[row.year];
    if (!yearArr) {
      KPI_BY_YEAR[row.year] = Array.from({ length: 12 }, (_, i) => emptyMonth(row.year, i));
    }
    const m = KPI_BY_YEAR[row.year][row.month - 1];
    if (!m) continue;
    m.grossRevenue += Number(row.gross_revenue);
    m.netRevenue += Number(row.net_revenue);
    m.operationalCosts += Number(row.operational_costs);
    m.operationalExpenses += Number(row.operational_expenses);
    m.ebitda += Number(row.ebitda);
    m.netProfit += Number(row.net_profit);
    m.cashBalance += Number(row.cash_balance);
    m.accountsReceivable += Number(row.accounts_receivable);
    m.accountsPayable += Number(row.accounts_payable);
    m.netMargin = m.netRevenue > 0 ? m.netProfit / m.netRevenue : 0;
    m.grossProfit = m.netRevenue - m.operationalCosts;
  }
}

async function loadTransactions() {
  const { data } = await supabase
    .from("financial_transactions")
    .select("*")
    .order("competence_date", { ascending: false })
    .limit(5000);
  if (!data) return;
  for (const k of Object.keys(TRANSACTIONS_BY_YEAR)) TRANSACTIONS_BY_YEAR[Number(k)] = [];
  for (const row of data) {
    const dateStr = row.payment_date ?? row.competence_date;
    if (!dateStr) continue;
    const year = new Date(dateStr).getFullYear();
    if (!TRANSACTIONS_BY_YEAR[year]) TRANSACTIONS_BY_YEAR[year] = [];
    const isRevenue =
      row.transaction_type === "revenue" || row.transaction_type === "financial_income";
    const isExpense =
      row.transaction_type === "expense" ||
      row.transaction_type === "financial_expense" ||
      row.transaction_type === "tax";
    if (!isRevenue && !isExpense) continue;
    TRANSACTIONS_BY_YEAR[year].push({
      id: row.id,
      date: dateStr,
      type: isRevenue ? "revenue" : "expense",
      party: row.customer_or_supplier_name ?? "—",
      category: row.category_name ?? "—",
      costCenter: row.cost_center_name ?? "Não alocado",
      amount: Number(row.amount),
      status: STATUS_MAP[row.status as DbStatus] ?? "Pendente",
    });
  }
}

async function loadAlerts() {
  const { data } = await supabase
    .from("alert_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (!data) return;
  ALERTS.length = 0;
  for (const row of data) {
    ALERTS.push({
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      severity: row.severity as AlertEvent["severity"],
      financialImpact: Number(row.financial_impact),
      recommendation: row.recommendation ?? "",
      createdAt: row.created_at,
      status: row.status as AlertEvent["status"],
    });
  }
}

async function loadTargets() {
  const { data } = await supabase
    .from("budget_targets")
    .select("category_name, planned_revenue, planned_expense")
    .eq("year", 2025);
  if (!data) return;
  TARGETS_2025.length = 0;
  const agg = new Map<string, { planned: number; realized: number }>();
  for (const row of data) {
    const cur = agg.get(row.category_name) ?? { planned: 0, realized: 0 };
    cur.planned += Number(row.planned_revenue) + Number(row.planned_expense);
    agg.set(row.category_name, cur);
  }
  for (const [category, v] of agg) {
    TARGETS_2025.push({ category, planned: v.planned, realized: v.realized });
  }
}

export function useLiveData() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadKpis(), loadTransactions(), loadAlerts(), loadTargets()]);
        if (!cancelled) setVersion((v) => v + 1);
      } catch (err) {
        console.error("[live-sync] failed to load Supabase data", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return version;
}

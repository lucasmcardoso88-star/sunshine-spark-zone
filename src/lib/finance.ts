import { KPI_BY_YEAR, TRANSACTIONS_BY_YEAR, type MonthlyKpi, type Transaction } from "@/data/mock";
import { monthsForFilters, type FiltersState } from "@/context/FiltersContext";
import { dateIsInRange, getLocalMonthIndex, monthOverlapsRange } from "@/lib/date";
import { classifyTransaction } from "@/lib/dre-classify";


export function getMonthlyKpis(f: FiltersState): MonthlyKpi[] {
  const hasCustomRange = Boolean(f.customStart || f.customEnd);

  // When filtering by a specific company (or with any tx-affecting filter),
  // derive KPIs from transactions so the company/category/cost-center filter
  // actually reflects on all dashboards.
  const deriveFromTx =
    f.company !== "all" || f.category !== "all" || f.costCenter !== "all";

  if (deriveFromTx) {
    const txs = getTransactions(f);
    const buckets = new Map<string, MonthlyKpi>();
    const key = (y: number, m: number) => `${y}-${m}`;
    for (const t of txs) {
      const dateStr = f.basis === "cash" 
        ? (t.paymentDate || t.date) 
        : (t.competencyDate || t.date);
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const m = getLocalMonthIndex(dateStr);
      if (m == null) continue;
      const k = key(y, m);
      let bucket = buckets.get(k);
      if (!bucket) {
        bucket = {
          year: y, monthIndex: m, monthLabel: "",
          grossRevenue: 0, taxes: 0, commissions: 0, netRevenue: 0,
          operationalCosts: 0, commercialExpenses: 0, adminExpenses: 0, operationalExpenses: 0,
          financialIncome: 0, financialExpense: 0, grossProfit: 0, ebitda: 0,
          netProfit: 0, netMargin: 0, cashIn: 0, cashOut: 0, cashBalance: 0,
          accountsReceivable: 0, accountsPayable: 0,
        };
        buckets.set(k, bucket);
      }
      const category = t.category || "Sem categoria";
      const line = classifyTransaction(t.type, category);
      if (t.type === "revenue") {
        if (line === "financialIncome") bucket.financialIncome += t.amount;
        else if (line === "taxes") bucket.taxes += t.amount;
        else if (line === "commissions") bucket.commissions += t.amount;
        else bucket.grossRevenue += t.amount;

        if (t.status === "Pago") bucket.cashIn += t.amount;
        else bucket.accountsReceivable += t.amount;
      } else {
        if (line === "taxes") bucket.taxes += t.amount;
        else if (line === "commissions") bucket.commissions += t.amount;
        else if (line === "operationalCosts") bucket.operationalCosts += t.amount;
        else if (line === "commercialExpenses") bucket.commercialExpenses += t.amount;
        else if (line === "adminExpenses") bucket.adminExpenses += t.amount;
        else if (line === "financialExpense") bucket.financialExpense += t.amount;
        else bucket.operationalExpenses += t.amount;
        if (t.status === "Pago") bucket.cashOut += t.amount;
        else bucket.accountsPayable += t.amount;
      }


    }
    const arr = [...buckets.values()].sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex);
    let balance = 0;
    for (const m of arr) {
      m.netRevenue = m.grossRevenue - m.taxes - m.commissions;
      m.grossProfit = m.netRevenue - m.operationalCosts;
      m.ebitda = m.grossProfit - m.commercialExpenses - m.adminExpenses - m.operationalExpenses;
      m.netProfit = m.ebitda + m.financialIncome - m.financialExpense;
      m.netMargin = m.netRevenue > 0 ? m.netProfit / m.netRevenue : 0;
      balance += m.cashIn - m.cashOut;
      m.cashBalance = balance;
    }
    return arr;
  }

  // Fast path — combined KPIs when no company/category/cost-center filter.
  const allYears = f.year === 0;
  const source = hasCustomRange || allYears
    ? Object.values(KPI_BY_YEAR).flat()
    : (KPI_BY_YEAR[f.year] ?? []);
  const months = hasCustomRange
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : monthsForFilters(f);

  return source.filter((k) => {
    if (!months.includes(k.monthIndex)) return false;
    if (hasCustomRange && !monthOverlapsRange(k.year, k.monthIndex, f.customStart, f.customEnd)) return false;
    return true;
  });
}

export function getTransactions(f: FiltersState): Transaction[] {
  const hasCustomRange = Boolean(f.customStart || f.customEnd);
  const allYears = f.year === 0;
  const list = hasCustomRange || allYears
    ? Object.values(TRANSACTIONS_BY_YEAR).flat()
    : (TRANSACTIONS_BY_YEAR[f.year] ?? []);
  const months = hasCustomRange
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : monthsForFilters(f);
  return list.filter((t) => {
    if (f.company !== "all" && t.company !== f.company) return false;
    if (!hasCustomRange) {
      const txMonth = getLocalMonthIndex(t.date);
      if (txMonth == null || !months.includes(txMonth)) return false;
    }
    if (hasCustomRange && !dateIsInRange(t.date, f.customStart, f.customEnd)) return false;
    if (f.costCenter !== "all" && t.costCenter !== f.costCenter) return false;
    if (f.category !== "all" && t.category !== f.category) return false;
    if (f.payment === "paid" && t.status !== "Pago") return false;
    if (f.payment === "open" && t.status === "Pago") return false;
    return true;
  });
}

/** Aggregates monthly KPIs for the period covered by current filters. */
export function getAggregateKpis(f: FiltersState) {
  const ks = getMonthlyKpis(f);
  if (ks.length === 0) return null;
  const sum = (sel: (k: MonthlyKpi) => number) => ks.reduce((a, b) => a + sel(b), 0);
  const grossRevenue = sum((k) => k.grossRevenue);
  const netRevenue = sum((k) => k.netRevenue);
  const operationalCosts = sum((k) => k.operationalCosts);
  const operationalExpenses = sum(
    (k) => k.operationalExpenses + k.commercialExpenses + k.adminExpenses,
  );
  const ebitda = sum((k) => k.ebitda);
  const netProfit = sum((k) => k.netProfit);
  const last = ks[ks.length - 1];
  const cashBalance = last?.cashBalance ?? 0;
  const accountsReceivable = last?.accountsReceivable ?? 0;
  const accountsPayable = last?.accountsPayable ?? 0;

  return {
    grossRevenue,
    netRevenue,
    operationalCosts,
    operationalExpenses,
    ebitda,
    netProfit,
    netMargin: netProfit / Math.max(1, netRevenue),
    cashBalance,
    accountsReceivable,
    accountsPayable,
  };
}

/** Variation vs same range, previous period (previous month if month filter, otherwise previous year). */
export function getVariation(f: FiltersState, metric: keyof MonthlyKpi): number | null {
  const current = getMonthlyKpis(f);
  if (current.length === 0) return null;
  const cur = current.reduce((a, b) => a + (b[metric] as number), 0);

  // previous: if single month, previous month same year; else previous year same range
  let prev: number | null = null;
  if (f.month !== "all") {
    const prevMonth = f.month === 1 ? 12 : f.month - 1;
    const prevYear = f.month === 1 ? f.year - 1 : f.year;
    const arr = KPI_BY_YEAR[prevYear] ?? [];
    const k = arr[prevMonth - 1];
    prev = k ? (k[metric] as number) : null;
  } else {
    const arr = KPI_BY_YEAR[f.year - 1] ?? [];
    const months = monthsForFilters(f);
    prev =
      arr
        .filter((k) => months.includes(k.monthIndex))
        .reduce((a, b) => a + (b[metric] as number), 0) || null;
  }
  if (prev == null || prev === 0) return null;
  return (cur - prev) / Math.abs(prev);
}

export function topByAmount(items: Transaction[], n = 5) {
  const map = new Map<string, number>();
  for (const t of items) map.set(t.party, (map.get(t.party) ?? 0) + t.amount);
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export function groupByCategory(items: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of items) map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

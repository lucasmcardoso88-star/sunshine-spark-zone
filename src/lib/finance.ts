import { KPI_BY_YEAR, TRANSACTIONS_BY_YEAR, type MonthlyKpi, type Transaction } from "@/data/mock";
import { monthsForFilters, type FiltersState } from "@/context/FiltersContext";
import { dateIsInRange, getLocalMonthIndex, monthOverlapsRange } from "@/lib/date";

export function getMonthlyKpis(f: FiltersState): MonthlyKpi[] {
  // KPI aggregate reflects W2 only (current live source). Other companies show empty.
  const companyHasData = f.company === "all" || f.company === "w2";
  if (!companyHasData) return [];

  const hasCustomRange = Boolean(f.customStart || f.customEnd);
  // With a custom date range, span all years and ignore year/quarter/month filters.
  const source = hasCustomRange
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
  const list = hasCustomRange
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
  const cashBalance = ks[ks.length - 1].cashBalance;
  const accountsReceivable = ks[ks.length - 1].accountsReceivable;
  const accountsPayable = ks[ks.length - 1].accountsPayable;
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

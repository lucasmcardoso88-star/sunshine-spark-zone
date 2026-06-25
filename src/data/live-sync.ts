import { useEffect, useState } from "react";
import { supabaseExternal as supabase } from "@/integrations/supabase-external/client";
import {
  KPI_BY_YEAR,
  TRANSACTIONS_BY_YEAR,
  ALERTS,
  TARGETS_2025,
  COST_CENTERS,
  EXPENSE_CATEGORIES,
  SERVICE_TYPES,
  type MonthlyKpi,
  type Transaction,
} from "@/data/mock";
import { MONTHS_PT } from "@/lib/format";

type ReceitaRow = {
  id: string;
  descricao: string | null;
  status: string | null;
  total: number | string | null;
  pago: number | string | null;
  nao_pago: number | string | null;
  data_vencimento: string | null;
  data_competencia: string | null;
  cliente_nome: string | null;
  categoria_nome: string | null;
  centro_de_custo_nome: string | null;
};

type DespesaRow = {
  id: string;
  descricao: string | null;
  status: string | null;
  total: number | string | null;
  pago: number | string | null;
  nao_pago: number | string | null;
  data_vencimento: string | null;
  data_competencia: string | null;
  fornecedor_nome: string | null;
  categoria_nome: string | null;
  centro_de_custo_nome: string | null;
};

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

const STATUS_MAP: Record<string, Transaction["status"]> = {
  ACQUITTED: "Pago",
  PAID: "Pago",
  PAGO: "Pago",
  PENDING: "Pendente",
  PENDENTE: "Pendente",
  OVERDUE: "Atrasado",
  VENCIDO: "Atrasado",
  ATRASADO: "Atrasado",
  CANCELED: "Pendente",
};

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatus(value: string | null | undefined): Transaction["status"] {
  return STATUS_MAP[(value ?? "").toUpperCase()] ?? "Pendente";
}

async function fetchAll<T>(table: "receitas" | "despesas") {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("data_vencimento", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function ensureYear(year: number) {
  if (!KPI_BY_YEAR[year]) KPI_BY_YEAR[year] = Array.from({ length: 12 }, (_, i) => emptyMonth(year, i));
  if (!TRANSACTIONS_BY_YEAR[year]) TRANSACTIONS_BY_YEAR[year] = [];
}

function pushUnique(list: string[], value: string | null | undefined) {
  const label = value?.trim();
  if (label && !list.includes(label)) list.push(label);
}

async function loadContaAzulData() {
  const [receitas, despesas] = await Promise.all([
    fetchAll<ReceitaRow>("receitas"),
    fetchAll<DespesaRow>("despesas"),
  ]);

  for (const year of Object.keys(KPI_BY_YEAR)) {
    const y = Number(year);
    const arr = KPI_BY_YEAR[y];
    for (let i = 0; i < arr.length; i++) arr[i] = emptyMonth(y, i);
  }
  for (const k of Object.keys(TRANSACTIONS_BY_YEAR)) TRANSACTIONS_BY_YEAR[Number(k)] = [];

  for (const row of receitas) {
    const dateStr = row.data_vencimento ?? row.data_competencia;
    if (!dateStr) continue;
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) continue;
    const year = dt.getFullYear();
    ensureYear(year);
    const month = KPI_BY_YEAR[year][dt.getMonth()];
    const total = asNumber(row.total);
    const paid = asNumber(row.pago);
    const open = asNumber(row.nao_pago) || (normalizeStatus(row.status) === "Pago" ? 0 : total);

    month.grossRevenue += total;
    month.netRevenue += total;
    month.cashIn += paid || total;
    month.accountsReceivable += open;
    TRANSACTIONS_BY_YEAR[year].push({
      id: row.id,
      date: dateStr,
      type: "revenue",
      party: row.cliente_nome ?? "—",
      category: row.categoria_nome ?? "Sem categoria",
      costCenter: row.centro_de_custo_nome ?? "Não alocado",
      amount: total,
      status: normalizeStatus(row.status),
    });
    pushUnique(SERVICE_TYPES as unknown as string[], row.categoria_nome);
    pushUnique(COST_CENTERS, row.centro_de_custo_nome);
  }

  for (const row of despesas) {
    const dateStr = row.data_vencimento ?? row.data_competencia;
    if (!dateStr) continue;
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) continue;
    const year = dt.getFullYear();
    ensureYear(year);
    const month = KPI_BY_YEAR[year][dt.getMonth()];
    const total = asNumber(row.total);
    const paid = asNumber(row.pago);
    const open = asNumber(row.nao_pago) || (normalizeStatus(row.status) === "Pago" ? 0 : total);

    month.operationalExpenses += total;
    month.cashOut += paid || total;
    month.accountsPayable += open;
    TRANSACTIONS_BY_YEAR[year].push({
      id: row.id,
      date: dateStr,
      type: "expense",
      party: row.fornecedor_nome ?? "—",
      category: row.categoria_nome ?? "Sem categoria",
      costCenter: row.centro_de_custo_nome ?? "Não alocado",
      amount: total,
      status: normalizeStatus(row.status),
    });
    pushUnique(EXPENSE_CATEGORIES as unknown as string[], row.categoria_nome);
    pushUnique(COST_CENTERS, row.centro_de_custo_nome);
  }

  for (const year of Object.keys(KPI_BY_YEAR).map(Number).sort()) {
    let balance = 0;
    for (const month of KPI_BY_YEAR[year]) {
      month.grossProfit = month.netRevenue - month.operationalCosts;
      month.ebitda = month.grossProfit - month.commercialExpenses - month.adminExpenses - month.operationalExpenses;
      month.netProfit = month.ebitda + month.financialIncome - month.financialExpense;
      month.netMargin = month.netRevenue > 0 ? month.netProfit / month.netRevenue : 0;
      balance += month.cashIn - month.cashOut;
      month.cashBalance = balance;
    }
    TRANSACTIONS_BY_YEAR[year].sort((a, b) => b.date.localeCompare(a.date));
  }

  ALERTS.length = 0;
  TARGETS_2025.length = 0;
}

export function useLiveData() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadContaAzulData();
        if (!cancelled) setVersion((v) => v + 1);
      } catch (err) {
        console.error("[live-sync] failed to load external financial data", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return version;
}

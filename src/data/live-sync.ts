import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseExternal } from "@/integrations/supabase-external/client";
import { getD61Data } from "@/lib/d61-data.functions";
import type { CompanyId } from "@/data/mock";
import { parseLocalDate } from "@/lib/date";
import { classifyExpense, isCommissionCategory, isTaxCategory } from "@/lib/dre-classify";

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
  RECEBIDO: "Pago",
  SETTLED: "Pago",
  LIQUIDADO: "Pago",
  PERDIDO: "Pago",
  LOST: "Pago",
  CANCELED: "Pago",
  CANCELLED: "Pago",
  CANCELADO: "Pago",
  PENDING: "Pendente",
  PENDENTE: "Pendente",
  OVERDUE: "Atrasado",
  VENCIDO: "Atrasado",
  ATRASADO: "Atrasado",
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

async function fetchAll<T>(client: SupabaseClient, table: "receitas" | "despesas") {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
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

const SOURCES: { company: Exclude<CompanyId, "all">; client: SupabaseClient }[] = [
  { company: "w2", client: supabaseExternal },
];

function ingestReceitas(company: Exclude<CompanyId, "all">, receitas: ReceitaRow[]) {
  for (const row of receitas) {
    const dateStr = row.data_vencimento ?? row.data_competencia;
    if (!dateStr) continue;
    const dt = parseLocalDate(dateStr);
    if (!dt) continue;
    const year = dt.getFullYear();
    ensureYear(year);
    const month = KPI_BY_YEAR[year][dt.getMonth()];
    const total = asNumber(row.total);
    const paid = asNumber(row.pago);
    const open = asNumber(row.nao_pago) || (normalizeStatus(row.status) === "Pago" ? 0 : total);

    const category = row.categoria_nome ?? "Sem categoria";
    const line = classifyRevenue(category);
    if (line === "financialIncome") month.financialIncome += total;
    else if (line === "taxes") month.taxes += total;
    else if (line === "commissions") month.commissions += total;
    else month.grossRevenue += total;

    month.cashIn += paid || total;
    month.accountsReceivable += open;



    TRANSACTIONS_BY_YEAR[year].push({
      id: `${company}:${row.id}`,
      date: dateStr,
      competencyDate: row.data_competencia || dateStr,
      paymentDate: row.data_vencimento || dateStr,
      type: "revenue",
      party: row.cliente_nome ?? "—",
      category,
      costCenter: row.centro_de_custo_nome ?? "Não alocado",
      amount: total,
      status: normalizeStatus(row.status),
      company,
    });
    pushUnique(SERVICE_TYPES as unknown as string[], row.categoria_nome);
    pushUnique(COST_CENTERS, row.centro_de_custo_nome);
  }
}

function ingestDespesas(company: Exclude<CompanyId, "all">, despesas: DespesaRow[]) {
  for (const row of despesas) {
    const dateStr = row.data_vencimento ?? row.data_competencia;
    if (!dateStr) continue;
    const dt = parseLocalDate(dateStr);
    if (!dt) continue;
    const year = dt.getFullYear();
    ensureYear(year);
    const month = KPI_BY_YEAR[year][dt.getMonth()];
    const total = asNumber(row.total);
    const paid = asNumber(row.pago);
    const open = asNumber(row.nao_pago) || (normalizeStatus(row.status) === "Pago" ? 0 : total);

    const category = row.categoria_nome ?? "Sem categoria";
    const bucket = classifyExpense(category);
    if (bucket === "taxes") month.taxes += total;
    else if (bucket === "commissions") month.commissions += total;
    else if (bucket === "operationalCosts") month.operationalCosts += total;
    else month.operationalExpenses += total;


    month.cashOut += paid || total;
    month.accountsPayable += open;
    TRANSACTIONS_BY_YEAR[year].push({
      id: `${company}:${row.id}`,
      date: dateStr,
      competencyDate: row.data_competencia || dateStr,
      paymentDate: row.data_vencimento || dateStr,
      type: "expense",
      party: row.fornecedor_nome ?? "—",
      category,
      costCenter: row.centro_de_custo_nome ?? "Não alocado",
      amount: total,
      status: normalizeStatus(row.status),
      company,
    });
    pushUnique(EXPENSE_CATEGORIES as unknown as string[], row.categoria_nome);
    pushUnique(COST_CENTERS, row.centro_de_custo_nome);
  }
}

async function loadSource(company: Exclude<CompanyId, "all">, client: SupabaseClient) {
  const [receitas, despesas] = await Promise.all([
    fetchAll<ReceitaRow>(client, "receitas").catch((err) => {
      console.warn(`[live-sync:${company}] receitas failed`, err);
      return [] as ReceitaRow[];
    }),
    fetchAll<DespesaRow>(client, "despesas").catch((err) => {
      console.warn(`[live-sync:${company}] despesas failed`, err);
      return [] as DespesaRow[];
    }),
  ]);
  ingestReceitas(company, receitas);
  ingestDespesas(company, despesas);
}

async function loadD61() {
  try {
    const { receitas, despesas } = await getD61Data();
    ingestReceitas("d61", (receitas ?? []) as ReceitaRow[]);
    ingestDespesas("d61", (despesas ?? []) as DespesaRow[]);
  } catch (err) {
    console.warn("[live-sync:d61] failed", err);
  }
}

async function loadContaAzulData() {
  for (const year of Object.keys(KPI_BY_YEAR)) {
    const y = Number(year);
    const arr = KPI_BY_YEAR[y];
    for (let i = 0; i < arr.length; i++) arr[i] = emptyMonth(y, i);
  }
  for (const k of Object.keys(TRANSACTIONS_BY_YEAR)) TRANSACTIONS_BY_YEAR[Number(k)] = [];

  await Promise.all([...SOURCES.map((s) => loadSource(s.company, s.client)), loadD61()]);

  for (const year of Object.keys(KPI_BY_YEAR).map(Number).sort()) {
    let balance = 0;
    for (const month of KPI_BY_YEAR[year]) {
      month.netRevenue = month.grossRevenue - month.taxes - month.commissions;
      month.grossProfit = month.netRevenue - month.operationalCosts;
      month.ebitda = month.grossProfit - month.commercialExpenses - month.adminExpenses - month.operationalExpenses;
      month.netProfit = month.ebitda + month.financialIncome - month.financialExpense;
      month.netMargin = month.netRevenue > 0 ? month.netProfit / month.netRevenue : 0;
      balance += month.cashIn - month.cashOut;
      month.cashBalance = balance;
    }
    TRANSACTIONS_BY_YEAR[year]?.sort((a, b) => b.date.localeCompare(a.date));
  }

  ALERTS.length = 0;
  TARGETS_2025.length = 0;
}



let loadPromise: Promise<void> | null = null;
let loaded = false;
const subscribers = new Set<() => void>();

function ensureLoad() {
  if (!loadPromise) {
    loadPromise = loadContaAzulData()
      .then(() => {
        loaded = true;
        subscribers.forEach((fn) => fn());
      })
      .catch((err) => {
        console.error("[live-sync] failed to load external financial data", err);
        loadPromise = null; // allow retry on next mount
      });
  }
  return loadPromise;
}

// Kick off the load as early as possible (module import), so data is ready
// before any route component mounts.
if (typeof window !== "undefined") {
  ensureLoad().catch(() => {});
}

export function useLiveData() {
  const [version, setVersion] = useState(loaded ? 1 : 0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    subscribers.add(bump);
    if (loaded) {
      setVersion((v) => (v === 0 ? 1 : v));
    } else {
      ensureLoad();
    }
    return () => {
      subscribers.delete(bump);
    };
  }, []);
  return version;
}

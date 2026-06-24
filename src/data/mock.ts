import { MONTHS_PT } from "@/lib/format";

// Dados zerados — substituir por leituras reais do banco quando disponível.

export type CompanyId = "all" | "main" | "growth" | "branding";
export type AccountingBasis = "cash" | "accrual";

export const COMPANIES: { id: Exclude<CompanyId, "all">; name: string }[] = [
  { id: "main", name: "W2 Publicidade" },
  { id: "growth", name: "Growth" },
  { id: "branding", name: "VeinUp / Mobilizze" },
];

export const COMPANY_OPTIONS: { id: CompanyId; name: string }[] = [
  { id: "all", name: "Todas as empresas" },
  ...COMPANIES,
];

export const CLIENTS: string[] = [];

export const SUPPLIERS: string[] = [];

export const SERVICE_TYPES = [] as const;

export const EXPENSE_CATEGORIES = [] as const;

export const COST_CENTERS = ["Não alocado", "Tributária", "Ocupação", "Pessoal"] as const;

export type MonthlyKpi = {
  year: number; monthIndex: number; monthLabel: string;
  grossRevenue: number; taxes: number; commissions: number; netRevenue: number;
  operationalCosts: number; commercialExpenses: number; adminExpenses: number; operationalExpenses: number;
  financialIncome: number; financialExpense: number; grossProfit: number; ebitda: number;
  netProfit: number; netMargin: number; cashIn: number; cashOut: number; cashBalance: number;
  accountsReceivable: number; accountsPayable: number;
};

export const KPI_BY_YEAR: Record<number, MonthlyKpi[]> = {
  2023: [],
  2024: [],
  2025: [],
  2026: [],
  2027: [],
};

export const YEARS = [2023, 2024, 2025, 2026, 2027] as const;

export type Transaction = { id: string; date: string; type: "revenue" | "expense"; party: string; category: string; costCenter: string; amount: number; status: "Pago" | "Pendente" | "Atrasado"; };

export const TRANSACTIONS_BY_YEAR: Record<number, Transaction[]> = {
  2024: [],
  2025: [],
  2026: [],
};

export type AlertEvent = { id: string; title: string; description: string; severity: "low" | "medium" | "high" | "critical"; financialImpact: number; recommendation: string; createdAt: string; status: "open" | "in_review" | "resolved"; };

export const ALERTS: AlertEvent[] = [];

export const TARGETS_2025: { category: string; planned: number; realized: number }[] = [];

// Mantido para evitar warning de import não usado em ambientes que não consomem MONTHS_PT diretamente.
export const _MONTHS_PT = MONTHS_PT;

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard, HorizontalBarsChart, DonutChart } from "@/components/common/FinancialChart";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge, type Tone } from "@/components/common/StatusBadge";
import { useFilters } from "@/context/FiltersContext";
import { getTransactions, groupByCategory, topByAmount } from "@/lib/finance";
import { formatBRL, formatDate } from "@/lib/format";
import type { Transaction } from "@/data/mock";

export const Route = createFileRoute("/_app/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Controladoria Agência" },
      { name: "description", content: "Análise de despesas por fornecedor, categoria e centro de custo." },
    ],
  }),
  component: DespesasPage,
});

const STATUS_TONE: Record<Transaction["status"], Tone> = {
  Pago: "positive", Pendente: "warning", Atrasado: "critical",
};

function DespesasPage() {
  const filters = useFilters();
  const txs = getTransactions(filters).filter((t) => t.type === "expense");

  const counts = new Map<string, number>();
  txs.forEach((t) => counts.set(t.party, (counts.get(t.party) ?? 0) + 1));
  const recurring = topByAmount(txs.filter((t) => (counts.get(t.party) ?? 0) > 2), 5);
  const newExpenses = topByAmount(txs.filter((t) => (counts.get(t.party) ?? 0) <= 2), 5);
  const byCategory = groupByCategory(txs);

  const cols: Column<Transaction>[] = [
    { key: "party", header: "Fornecedor", cell: (t) => t.party },
    { key: "cat", header: "Categoria", cell: (t) => t.category },
    { key: "cc", header: "Centro de custo", cell: (t) => t.costCenter },
    { key: "amt", header: "Valor", className: "text-right", cell: (t) => <span className="tabular-nums">{formatBRL(t.amount)}</span> },
    { key: "date", header: "Data", cell: (t) => formatDate(t.date) },
    { key: "status", header: "Status", cell: (t) => <StatusBadge tone={STATUS_TONE[t.status]}>{t.status}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader title="Despesas" description="Despesas por fornecedor, categoria e centro de custo." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top fornecedores recorrentes"><HorizontalBarsChart data={recurring} /></ChartCard>
        <ChartCard title="Top novas despesas"><HorizontalBarsChart data={newExpenses} /></ChartCard>
        <ChartCard title="Despesas por categoria"><DonutChart data={byCategory} /></ChartCard>
        <ChartCard title="Distribuição em barras"><HorizontalBarsChart data={byCategory} /></ChartCard>
      </div>
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Detalhamento</h3>
        <DataTable columns={cols} rows={txs.slice(0, 50)} emptyTitle="Sem despesas no período" />
      </div>
    </>
  );
}
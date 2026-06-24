import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard, HorizontalBarsChart, DonutChart } from "@/components/common/FinancialChart";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge, type Tone } from "@/components/common/StatusBadge";
import { useFilters } from "@/context/FiltersContext";
import { getTransactions, groupByCategory, topByAmount } from "@/lib/finance";
import { formatBRL, formatDate } from "@/lib/format";
import type { Transaction } from "@/data/mock";

export const Route = createFileRoute("/_app/receitas")({
  head: () => ({
    meta: [
      { title: "Receitas — Controladoria Agência" },
      { name: "description", content: "Análise de receita por cliente, categoria e centro de custo." },
    ],
  }),
  component: ReceitasPage,
});

const STATUS_TONE: Record<Transaction["status"], Tone> = {
  Pago: "positive", Pendente: "warning", Atrasado: "critical",
};

function ReceitasPage() {
  const filters = useFilters();
  const txs = getTransactions(filters).filter((t) => t.type === "revenue");

  // Recurring = appears more than once; new = appears once
  const counts = new Map<string, number>();
  txs.forEach((t) => counts.set(t.party, (counts.get(t.party) ?? 0) + 1));
  const recurring = topByAmount(txs.filter((t) => (counts.get(t.party) ?? 0) > 2), 5);
  const newClients = topByAmount(txs.filter((t) => (counts.get(t.party) ?? 0) <= 2), 5);
  const byCostCenter = (() => {
    const m = new Map<string, number>();
    for (const t of txs) m.set(t.costCenter, (m.get(t.costCenter) ?? 0) + t.amount);
    return [...m.entries()].map(([name, amount]) => ({ name, amount }));
  })();
  const byService = groupByCategory(txs);

  const cols: Column<Transaction>[] = [
    { key: "party", header: "Cliente", cell: (t) => t.party },
    { key: "cat", header: "Categoria", cell: (t) => t.category },
    { key: "cc", header: "Centro de custo", cell: (t) => t.costCenter },
    { key: "amt", header: "Valor", className: "text-right", cell: (t) => <span className="tabular-nums">{formatBRL(t.amount)}</span> },
    { key: "date", header: "Data", cell: (t) => formatDate(t.date) },
    { key: "status", header: "Status", cell: (t) => <StatusBadge tone={STATUS_TONE[t.status]}>{t.status}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader title="Receitas" description="Receita por cliente, tipo de serviço e centro de custo." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top clientes recorrentes"><HorizontalBarsChart data={recurring} /></ChartCard>
        <ChartCard title="Top novos clientes"><HorizontalBarsChart data={newClients} /></ChartCard>
        <ChartCard title="Receita por centro de custo"><HorizontalBarsChart data={byCostCenter} /></ChartCard>
        <ChartCard title="Receita por tipo de serviço"><DonutChart data={byService} /></ChartCard>
      </div>
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Detalhamento</h3>
        <DataTable columns={cols} rows={txs.slice(0, 50)} emptyTitle="Sem receitas no período" />
      </div>
    </>
  );
}
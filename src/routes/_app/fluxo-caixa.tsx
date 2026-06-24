import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { ChartCard, MultiBarChart } from "@/components/common/FinancialChart";
import { EmptyState } from "@/components/common/EmptyState";
import { useFilters } from "@/context/FiltersContext";
import { getMonthlyKpis } from "@/lib/finance";
import { MONTHS_PT, formatBRL } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, Calendar } from "lucide-react";

export const Route = createFileRoute("/_app/fluxo-caixa")({
  head: () => ({
    meta: [
      { title: "Fluxo de Caixa — Controladoria Agência" },
      { name: "description", content: "Visão mensal de entradas, saídas e saldo acumulado." },
    ],
  }),
  component: FluxoCaixaPage,
});

function FluxoCaixaPage() {
  const filters = useFilters();
  const all = getMonthlyKpis({ ...filters, quarter: "all", month: "all" });
  const period = getMonthlyKpis(filters);

  if (all.length === 0) {
    return (
      <>
        <PageHeader title="Fluxo de Caixa" />
        <EmptyState />
      </>
    );
  }

  const data = all.map((k) => ({
    month: MONTHS_PT[k.monthIndex],
    Entradas: k.cashIn,
    Saídas: k.cashOut,
    "Saldo acumulado": k.cashBalance,
  }));

  const initialBalance = period.length ? period[0].cashBalance - (period[0].cashIn - period[0].cashOut) : 0;
  const totalIn = period.reduce((a, b) => a + b.cashIn, 0);
  const totalOut = period.reduce((a, b) => a + b.cashOut, 0);
  const finalBalance = period.length ? period[period.length - 1].cashBalance : 0;
  const projected30 = finalBalance + (totalIn - totalOut) / Math.max(1, period.length);

  return (
    <>
      <PageHeader title="Fluxo de Caixa" description="Entradas, saídas e saldo acumulado por mês." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Saldo inicial" value={initialBalance} icon={Wallet} tone="neutral" />
        <KpiCard label="Entradas" value={totalIn} icon={ArrowDownCircle} tone="positive" />
        <KpiCard label="Saídas" value={totalOut} icon={ArrowUpCircle} tone="warning" />
        <KpiCard label="Saldo final" value={finalBalance} icon={TrendingUp} tone={finalBalance > 0 ? "positive" : "critical"} />
        <KpiCard label="Caixa projetado 30 dias" value={projected30} icon={Calendar} tone={projected30 > 0 ? "positive" : "critical"} />
      </div>

      <div className="mt-6">
        <ChartCard title="Fluxo mensal" subtitle="Entradas, Saídas e Saldo acumulado">
          <MultiBarChart
            data={data}
            xKey="month"
            series={[
              { key: "Entradas", name: "Entradas", color: "var(--chart-1)" },
              { key: "Saídas", name: "Saídas", color: "var(--chart-3)" },
              { key: "Saldo acumulado", name: "Saldo acumulado", color: "var(--chart-2)" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 sticky left-0 bg-secondary/60">Linha</th>
              {all.map((k) => (<th key={k.monthIndex} className="text-right px-3 py-3">{MONTHS_PT[k.monthIndex]}</th>))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border/60">
              <td className="px-4 py-2 sticky left-0 bg-card">Entradas</td>
              {all.map((k) => (<td key={k.monthIndex} className="px-3 py-2 text-right tabular-nums">{formatBRL(k.cashIn)}</td>))}
            </tr>
            <tr className="border-t border-border/60">
              <td className="px-4 py-2 sticky left-0 bg-card">Saídas</td>
              {all.map((k) => (<td key={k.monthIndex} className="px-3 py-2 text-right tabular-nums text-destructive">{formatBRL(-k.cashOut)}</td>))}
            </tr>
            <tr className="border-t border-border/60 bg-primary/5 font-medium">
              <td className="px-4 py-2 sticky left-0 bg-primary/5">Saldo do mês</td>
              {all.map((k) => (<td key={k.monthIndex} className="px-3 py-2 text-right tabular-nums">{formatBRL(k.cashIn - k.cashOut)}</td>))}
            </tr>
            <tr className="border-t border-border/60 bg-primary/10 font-semibold">
              <td className="px-4 py-2 sticky left-0 bg-primary/10">Saldo acumulado</td>
              {all.map((k) => (<td key={k.monthIndex} className="px-3 py-2 text-right tabular-nums">{formatBRL(k.cashBalance)}</td>))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
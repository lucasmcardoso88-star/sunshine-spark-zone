import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  BadgeDollarSign,
  PiggyBank,
  Calculator,
  Percent,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, type KpiTone } from "@/components/common/KpiCard";
import { ChartCard, MultiBarChart, HorizontalBarsChart } from "@/components/common/FinancialChart";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, type Tone } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useFilters } from "@/context/FiltersContext";
import {
  getAggregateKpis,
  getMonthlyKpis,
  getTransactions,
  getVariation,
  groupByCategory,
  topByAmount,
} from "@/lib/finance";
import { MONTHS_PT, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Painel Gerencial — Controladoria Agência" },
      { name: "description", content: "Visão consolidada dos indicadores financeiros da agência." },
    ],
  }),
  component: PainelGerencial,
});

function toneFor(variation: number | null | undefined, invert = false): KpiTone {
  if (variation == null) return "neutral";
  const v = invert ? -variation : variation;
  if (v >= 0.02) return "positive";
  if (v >= -0.05) return "warning";
  return "critical";
}

function PainelGerencial() {
  const filters = useFilters();
  const agg = useMemo(() => getAggregateKpis(filters), [filters]);
  const monthly = useMemo(() => getMonthlyKpis(filters), [filters]);
  const allYear = useMemo(
    () => getMonthlyKpis({ ...filters, quarter: "all", month: "all" }),
    [filters],
  );
  const txs = useMemo(() => getTransactions(filters), [filters]);

  if (!agg) {
    return (
      <>
        <PageHeader title="Painel Gerencial" />
        <EmptyState
          title="Sem dados para o período selecionado"
          description="Revise empresa, período, centro de custo ou categoria para encontrar dados financeiros."
          actionLabel="Limpar filtros"
          onAction={filters.resetFilters}
        />
      </>
    );
  }

  const quickRead: { label: string; status: string; tone: Tone; detail: string }[] = [
    {
      label: "Receita",
      status: (getVariation(filters, "netRevenue") ?? 0) >= -0.03 ? "dentro" : "abaixo",
      tone: (getVariation(filters, "netRevenue") ?? 0) >= -0.03 ? "positive" : "warning",
      detail: "Comparada ao período anterior e à meta operacional.",
    },
    {
      label: "Despesas",
      status: (getVariation(filters, "operationalExpenses") ?? 0) <= 0.04 ? "dentro" : "acima",
      tone: (getVariation(filters, "operationalExpenses") ?? 0) <= 0.04 ? "positive" : "critical",
      detail: "Custos, comercial, administrativo e despesas operacionais.",
    },
    {
      label: "Margem",
      status: agg.netMargin >= 0.15 ? "saudável" : agg.netMargin >= 0.08 ? "atenção" : "crítica",
      tone: agg.netMargin >= 0.15 ? "positive" : agg.netMargin >= 0.08 ? "warning" : "critical",
      detail: "Lucro líquido dividido pela receita líquida.",
    },
    {
      label: "Caixa",
      status: agg.cashBalance > 90000 ? "confortável" : agg.cashBalance > 0 ? "atenção" : "risco",
      tone: agg.cashBalance > 90000 ? "positive" : agg.cashBalance > 0 ? "warning" : "critical",
      detail: "Saldo acumulado de caixa no período filtrado.",
    },
  ];

  const monthChartData = allYear.map((k) => ({
    month: MONTHS_PT[k.monthIndex],
    Receita: k.netRevenue,
    Despesas: k.operationalCosts + k.commercialExpenses + k.adminExpenses + k.operationalExpenses,
    Lucro: k.netProfit,
  }));

  const cashChartData = allYear.map((k) => ({
    month: MONTHS_PT[k.monthIndex],
    Entradas: k.cashIn,
    Saídas: k.cashOut,
    "Geração de Caixa": k.cashIn - k.cashOut,
  }));

  const topClients = topByAmount(
    txs.filter((t) => t.type === "revenue"),
    5,
  );
  const topExpenseCategories = groupByCategory(txs.filter((t) => t.type === "expense")).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Painel Gerencial"
        description={`Visão consolidada • ${filters.year === 0 ? "Todos os anos" : filters.year} • ${filters.basis === "accrual" ? "Competência" : "Caixa"}`}
      />

      {/* Leitura rápida — chips executivos */}
      <section className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-muted-foreground">Leitura rápida:</span>
        {quickRead.map((item) => (
          <TooltipProvider key={item.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs">
                  <span className="mr-2 font-medium text-muted-foreground">{item.label}</span>
                  <StatusBadge tone={item.tone} className="border-0 px-1.5 py-0">
                    {item.tone === "positive" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {item.status}
                  </StatusBadge>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{item.detail}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </section>

      {/* Indicadores principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          size="lg"
          label="Receita Líquida"
          value={agg.netRevenue}
          icon={BadgeDollarSign}
          variation={getVariation(filters, "netRevenue")}
          tone={toneFor(getVariation(filters, "netRevenue"))}
          formula="Receita bruta menos impostos e comissões."
          trend={allYear.map((k) => k.netRevenue)}
        />
        <KpiCard
          size="lg"
          label="EBITDA"
          value={agg.ebitda}
          icon={TrendingUp}
          variation={getVariation(filters, "ebitda")}
          tone={toneFor(getVariation(filters, "ebitda"))}
          formula="Lucro bruto menos despesas comerciais, administrativas e operacionais."
          trend={allYear.map((k) => k.ebitda)}
        />
        <KpiCard
          size="lg"
          label="Lucro Líquido"
          value={agg.netProfit}
          icon={PiggyBank}
          variation={getVariation(filters, "netProfit")}
          tone={toneFor(getVariation(filters, "netProfit"))}
          formula="EBITDA mais receitas financeiras menos despesas financeiras."
          trend={allYear.map((k) => k.netProfit)}
        />
        <KpiCard
          size="lg"
          label="Margem Líquida"
          value={agg.netMargin}
          icon={Percent}
          formatValue={(n) => formatPercent(n)}
          tone={agg.netMargin >= 0.15 ? "positive" : agg.netMargin >= 0.08 ? "warning" : "critical"}
          formula="Lucro líquido dividido pela receita líquida."
        />
      </div>

      {/* Indicadores complementares */}
      <p className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Detalhamento
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Receita Bruta"
          value={agg.grossRevenue}
          icon={Receipt}
          variation={getVariation(filters, "grossRevenue")}
          tone={toneFor(getVariation(filters, "grossRevenue"))}
          formula="Soma das receitas brutas no período filtrado."
        />
        <KpiCard
          label="Custos Operacionais"
          value={agg.operationalCosts}
          icon={Calculator}
          variation={getVariation(filters, "operationalCosts")}
          tone={toneFor(getVariation(filters, "operationalCosts"), true)}
          formula="Custos diretos dos serviços prestados no período."
        />
        <KpiCard
          label="Despesas Operacionais"
          value={agg.operationalExpenses}
          icon={TrendingDown}
          variation={getVariation(filters, "operationalExpenses")}
          tone={toneFor(getVariation(filters, "operationalExpenses"), true)}
          formula="Despesas comerciais, administrativas e operacionais somadas."
        />
        <KpiCard
          label="Saldo de Caixa"
          value={agg.cashBalance}
          icon={Wallet}
          tone={agg.cashBalance > 0 ? "positive" : "critical"}
          formula="Saldo acumulado de caixa no último mês do período."
        />
        <KpiCard
          label="Contas a Receber"
          value={agg.accountsReceivable}
          icon={ArrowDownToLine}
          tone="neutral"
          formula="Recebíveis em aberto no fechamento do período."
        />
        <KpiCard
          label="Contas a Pagar"
          value={agg.accountsPayable}
          icon={ArrowUpFromLine}
          tone="warning"
          formula="Compromissos a pagar no fechamento do período."
        />
      </div>

      {monthly.length === 0 ? (
        <Card className="mt-6 rounded-2xl border-border/70 p-5 shadow-none">
          <EmptyState
            title="Sem metas cadastradas para o período"
            description="Cadastre metas ou selecione outro intervalo para comparar previsto x realizado."
            actionLabel="Ir para metas"
          />
        </Card>
      ) : null}

      <p className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Análises
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Receita x Despesas x Lucro" subtitle="Visão mensal do ano">
          <MultiBarChart
            data={monthChartData}
            xKey="month"
            series={[
              { key: "Receita", name: "Receita Líquida", color: "var(--chart-1)" },
              { key: "Despesas", name: "Despesas + Custos", color: "var(--chart-3)" },
              { key: "Lucro", name: "Lucro Líquido", color: "var(--chart-2)" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Entradas x Saídas x Geração de Caixa" subtitle="Visão mensal do ano">
          <MultiBarChart
            data={cashChartData}
            xKey="month"
            series={[
              { key: "Entradas", name: "Entradas", color: "var(--chart-1)" },
              { key: "Saídas", name: "Saídas", color: "var(--chart-3)" },
              { key: "Geração de Caixa", name: "Geração de Caixa", color: "var(--chart-2)" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Top 5 clientes por receita" subtitle="Período selecionado">
          <HorizontalBarsChart data={topClients} />
        </ChartCard>
        <ChartCard title="Top 5 categorias de despesa" subtitle="Período selecionado">
          <HorizontalBarsChart data={topExpenseCategories} />
        </ChartCard>
      </div>
    </>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge, type Tone } from "@/components/common/StatusBadge";
import { TARGETS_2025 } from "@/data/mock";
import { formatBRL, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_app/previsto-realizado")({
  head: () => ({
    meta: [
      { title: "Previsto x Realizado — Controladoria Agência" },
      { name: "description", content: "Acompanhe metas de receita e orçamento de despesas." },
    ],
  }),
  component: PrevistoRealizadoPage,
});

type Row = (typeof TARGETS_2025)[number] & {
  diff: number;
  diffPct: number;
  isRevenue: boolean;
};

function statusOf(row: Row): { tone: Tone; label: string } {
  // For revenue: positive diff is good. For expense: negative diff (under budget) is good.
  const good = row.isRevenue ? row.diffPct >= -0.03 : row.diffPct <= 0.03;
  const bad = row.isRevenue ? row.diffPct < -0.1 : row.diffPct > 0.1;
  if (bad) return { tone: "critical", label: "Crítico" };
  if (!good) return { tone: "warning", label: "Atenção" };
  return { tone: "positive", label: "Dentro do planejado" };
}

function PrevistoRealizadoPage() {
  const rows: Row[] = TARGETS_2025.map((t) => {
    const isRevenue = t.category.startsWith("Receita");
    const diff = t.realized - t.planned;
    return { ...t, isRevenue, diff, diffPct: diff / Math.max(1, t.planned) };
  });

  const revenuePlanned = rows.filter((r) => r.isRevenue).reduce((a, b) => a + b.planned, 0);
  const revenueRealized = rows.filter((r) => r.isRevenue).reduce((a, b) => a + b.realized, 0);
  const expensePlanned = rows.filter((r) => !r.isRevenue).reduce((a, b) => a + b.planned, 0);
  const expenseRealized = rows.filter((r) => !r.isRevenue).reduce((a, b) => a + b.realized, 0);

  const revPct = Math.min(150, (revenueRealized / revenuePlanned) * 100);
  const expPct = Math.min(150, (expenseRealized / expensePlanned) * 100);

  const cols: Column<Row>[] = [
    { key: "cat", header: "Categoria", cell: (r) => r.category },
    { key: "plan", header: "Previsto", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.planned)}</span> },
    { key: "real", header: "Realizado", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.realized)}</span> },
    { key: "diff", header: "Diferença R$", className: "text-right", cell: (r) =>
      <span className={"tabular-nums " + (r.diff < 0 ? "text-destructive" : "text-[color:var(--success)]")}>{formatBRL(r.diff)}</span> },
    { key: "diffp", header: "Diferença %", className: "text-right", cell: (r) =>
      <span className="tabular-nums">{formatPercent(r.diffPct)}</span> },
    { key: "status", header: "Status", cell: (r) => {
      const s = statusOf(r); return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
    }},
  ];

  return (
    <>
      <PageHeader title="Previsto x Realizado" description="Comparativo das metas de receita e orçamento de despesas." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5 rounded-2xl shadow-sm border-border/60">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Receita realizada x meta</p>
          <p className="mt-2 text-2xl font-semibold">{formatBRL(revenueRealized)} <span className="text-sm font-normal text-muted-foreground">/ {formatBRL(revenuePlanned)}</span></p>
          <Progress value={revPct} className="mt-3 h-3" />
          <p className="mt-2 text-xs text-muted-foreground">{revPct.toFixed(1)}% da meta</p>
        </Card>
        <Card className="p-5 rounded-2xl shadow-sm border-border/60">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Despesas realizadas x orçamento</p>
          <p className="mt-2 text-2xl font-semibold">{formatBRL(expenseRealized)} <span className="text-sm font-normal text-muted-foreground">/ {formatBRL(expensePlanned)}</span></p>
          <Progress value={expPct} className="mt-3 h-3" />
          <p className="mt-2 text-xs text-muted-foreground">{expPct.toFixed(1)}% do orçamento</p>
        </Card>
      </div>
      <DataTable columns={cols} rows={rows} />
    </>
  );
}
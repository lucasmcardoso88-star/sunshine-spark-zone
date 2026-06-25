import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, type Tone } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  ChartCard,
  HorizontalBarsChart,
  DonutChart,
} from "@/components/common/FinancialChart";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { BRL, MONTHS_PT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Financeiro — Controladoria" },
      { name: "description", content: "Visão consolidada de receitas, despesas e contas em aberto." },
    ],
  }),
  component: DashboardPage,
});

type DbStatus = "pending" | "paid" | "overdue" | "canceled";
type DbType = "revenue" | "expense";

type Row = {
  id: string;
  transaction_type: DbType;
  description: string | null;
  customer_or_supplier_name: string | null;
  category_name: string | null;
  cost_center_name: string | null;
  amount: number;
  due_date: string | null;
  payment_date: string | null;
  status: DbStatus;
};

const STATUS_LABEL: Record<DbStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
  canceled: "Cancelado",
};
const STATUS_TONE: Record<DbStatus, Tone> = {
  paid: "positive",
  pending: "warning",
  overdue: "critical",
  canceled: "neutral",
};

const tickFmt = (n: number) =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
const tooltipFmt = (v: number | string) =>
  typeof v === "number" ? BRL.format(v) : v;

function DashboardPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);

  // filters
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [costCenterFilter, setCostCenterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("financial_transactions")
        .select(
          "id, transaction_type, description, customer_or_supplier_name, category_name, cost_center_name, amount, due_date, payment_date, status",
        )
        .order("due_date", { ascending: true })
        .limit(5000);
      if (!mounted) return;
      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data ?? []) as Row[]);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const all = rows ?? [];

  const categories = useMemo(
    () =>
      Array.from(
        new Set(all.map((r) => r.category_name).filter(Boolean) as string[]),
      ).sort(),
    [all],
  );
  const costCenters = useMemo(
    () =>
      Array.from(
        new Set(all.map((r) => r.cost_center_name).filter(Boolean) as string[]),
      ).sort(),
    [all],
  );

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (categoryFilter !== "all" && r.category_name !== categoryFilter) return false;
      if (costCenterFilter !== "all" && r.cost_center_name !== costCenterFilter)
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (monthFilter !== "all") {
        const ref = r.payment_date ?? r.due_date;
        if (!ref) return false;
        const m = String(new Date(ref).getMonth() + 1).padStart(2, "0");
        if (m !== monthFilter) return false;
      }
      return true;
    });
  }, [all, monthFilter, categoryFilter, costCenterFilter, statusFilter]);

  const revenues = filtered.filter((r) => r.transaction_type === "revenue");
  const expenses = filtered.filter((r) => r.transaction_type === "expense");

  const totalRevenue = revenues.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpense = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const netResult = totalRevenue - totalExpense;

  const openItems = filtered.filter(
    (r) => r.status === "pending" || r.status === "overdue",
  );
  const openTotal = openItems.reduce((s, r) => s + Number(r.amount || 0), 0);

  // monthly chart
  const monthly = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS_PT[i],
      Receitas: 0,
      Despesas: 0,
      Saldo: 0,
    }));
    for (const r of filtered) {
      const ref = r.payment_date ?? r.due_date;
      if (!ref) continue;
      const idx = new Date(ref).getMonth();
      if (r.transaction_type === "revenue") buckets[idx].Receitas += Number(r.amount || 0);
      else buckets[idx].Despesas += Number(r.amount || 0);
    }
    let running = 0;
    for (const b of buckets) {
      running += b.Receitas - b.Despesas;
      b.Saldo = running;
    }
    return buckets;
  }, [filtered]);

  // group helper
  const groupByCat = (items: Row[]) => {
    const map = new Map<string, number>();
    for (const r of items) {
      const k = r.category_name ?? "Sem categoria";
      map.set(k, (map.get(k) ?? 0) + Number(r.amount || 0));
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };
  const groupByClient = (items: Row[]) => {
    const map = new Map<string, number>();
    for (const r of items) {
      const k = r.customer_or_supplier_name ?? "Sem cliente";
      map.set(k, (map.get(k) ?? 0) + Number(r.amount || 0));
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const revenueByCat = groupByCat(revenues);
  const expenseByCat = groupByCat(expenses);
  const topClients = groupByClient(revenues).slice(0, 5);
  const topExpenseCats = expenseByCat.slice(0, 5);

  const openSorted = [...openItems].sort((a, b) => {
    const da = a.due_date ? new Date(a.due_date).getTime() : 0;
    const db = b.due_date ? new Date(b.due_date).getTime() : 0;
    return da - db;
  });

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard Financeiro" />
        <Card className="rounded-2xl border-border p-8 text-center text-sm text-muted-foreground">
          Carregando dados…
        </Card>
      </>
    );
  }

  const noData = all.length === 0;

  return (
    <>
      <PageHeader
        title="Dashboard Financeiro"
        description="Receitas, despesas, resultado líquido e contas em aberto."
      />

      {/* Filtros */}
      <Card className="mb-6 rounded-2xl border-border p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Mês">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MONTHS_PT.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Categoria">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Centro de custo">
            <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {costCenters.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pago (ACQUITTED)</SelectItem>
                <SelectItem value="pending">Pendente (PENDING)</SelectItem>
                <SelectItem value="overdue">Vencido (OVERDUE)</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Receitas" value={totalRevenue} icon={<TrendingUp className="h-5 w-5" />} tone="positive" />
        <Kpi label="Total Despesas" value={totalExpense} icon={<TrendingDown className="h-5 w-5" />} tone="critical" />
        <Kpi
          label="Resultado Líquido"
          value={netResult}
          icon={<Scale className="h-5 w-5" />}
          tone={netResult >= 0 ? "positive" : "critical"}
        />
        <Kpi
          label="Contas em Aberto"
          value={openTotal}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="warning"
          subtitle={`${openItems.length} lançamentos`}
        />
      </div>

      {noData ? (
        <Card className="rounded-2xl border-border p-5 shadow-sm">
          <EmptyState
            title="Sem lançamentos sincronizados"
            description="Assim que os dados do Conta Azul forem importados para a base, este dashboard será preenchido automaticamente."
          />
        </Card>
      ) : (
        <>
          {/* Monthly chart */}
          <ChartCard title="Receitas x Despesas por mês" subtitle="Linha de saldo acumulado">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} tickFormatter={tickFmt} stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={tooltipFmt}
                  contentStyle={{ borderRadius: 12, borderColor: "var(--border)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="Saldo" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* DRE simplificado */}
          <Card className="mt-6 rounded-2xl border-border p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">DRE Simplificado</h3>
              <p className="text-xs text-muted-foreground">Receitas e despesas agrupadas por categoria.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <DreBlock title="Receitas" items={revenueByCat} total={totalRevenue} tone="positive" />
              <DreBlock title="Despesas" items={expenseByCat} total={totalExpense} tone="critical" />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
              <span className="text-sm font-semibold text-foreground">Resultado Líquido</span>
              <span className={`text-lg font-semibold ${netResult >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {BRL.format(netResult)}
              </span>
            </div>
          </Card>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Despesas por categoria" subtitle="Top 5 — maior gasto">
              <HorizontalBarsChart data={topExpenseCats} />
            </ChartCard>
            <ChartCard title="Distribuição de despesas" subtitle="Participação por categoria">
              <DonutChart data={expenseByCat.slice(0, 6)} />
            </ChartCard>
            <ChartCard title="Top clientes por receita" subtitle="Maiores clientes do período">
              <HorizontalBarsChart data={topClients} />
            </ChartCard>
            <ChartCard title="Receitas por categoria">
              <HorizontalBarsChart data={revenueByCat.slice(0, 5)} />
            </ChartCard>
          </div>

          {/* Contas em aberto */}
          <Card className="mt-6 rounded-2xl border-border p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Contas em aberto</h3>
                <p className="text-xs text-muted-foreground">
                  Receitas a receber e despesas a pagar, ordenadas por vencimento.
                </p>
              </div>
              <StatusBadge tone="warning">{openItems.length} em aberto</StatusBadge>
            </div>
            {openSorted.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma conta em aberto com os filtros atuais.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente / Fornecedor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openSorted.slice(0, 100).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.due_date ? formatDate(r.due_date) : "—"}</TableCell>
                        <TableCell>
                          <StatusBadge tone={r.transaction_type === "revenue" ? "positive" : "critical"}>
                            {r.transaction_type === "revenue" ? "Receita" : "Despesa"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate">
                          {r.description ?? "—"}
                        </TableCell>
                        <TableCell>{r.customer_or_supplier_name ?? "—"}</TableCell>
                        <TableCell>{r.category_name ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge tone={STATUS_TONE[r.status]}>
                            {STATUS_LABEL[r.status]}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {BRL.format(Number(r.amount || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "positive" | "critical" | "warning";
  subtitle?: string;
}) {
  const ring =
    tone === "positive"
      ? "ring-emerald-500/20 text-emerald-500"
      : tone === "critical"
        ? "ring-rose-500/20 text-rose-500"
        : "ring-amber-500/20 text-amber-500";
  return (
    <Card className="rounded-2xl border-border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-card ring-1 ${ring}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{BRL.format(value)}</p>
      {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
    </Card>
  );
}

function DreBlock({
  title,
  items,
  total,
  tone,
}: {
  title: string;
  items: { name: string; amount: number }[];
  total: number;
  tone: "positive" | "critical";
}) {
  const color = tone === "positive" ? "text-emerald-500" : "text-rose-500";
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className={`text-sm font-semibold ${color}`}>{BRL.format(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="py-3 text-xs text-muted-foreground">Sem lançamentos.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.slice(0, 8).map((it) => {
            const pct = total > 0 ? (it.amount / total) * 100 : 0;
            return (
              <li key={it.name} className="flex items-center justify-between py-2 text-sm">
                <span className="min-w-0 truncate pr-2 text-foreground">{it.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                  <span className="font-mono text-foreground">{BRL.format(it.amount)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

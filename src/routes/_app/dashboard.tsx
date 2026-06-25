import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowDownCircle,
  ArrowUpCircle,
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
import { Button } from "@/components/ui/button";
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
import { ChartCard, HorizontalBarsChart } from "@/components/common/FinancialChart";
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
import { supabaseExternal as supabase } from "@/integrations/supabase-external/client";
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

type ReceitaRow = {
  id: string;
  descricao: string | null;
  total: number | string | null;
  recebido: number | string | null;
  a_receber: number | string | null;
  data_vencimento: string | null;
  data_competencia: string | null;
  status: string | null;
  cliente_nome: string | null;
  categoria_nome: string | null;
  centro_de_custo_nome: string | null;
};
type DespesaRow = {
  id: string;
  descricao: string | null;
  total: number | string | null;
  pago: number | string | null;
  nao_pago: number | string | null;
  data_vencimento: string | null;
  data_competencia: string | null;
  status: string | null;
  fornecedor_nome: string | null;
  categoria_nome: string | null;
  centro_de_custo_nome: string | null;
};

type NormStatus = "ACQUITTED" | "PENDING" | "OVERDUE";

const STATUS_LABEL: Record<NormStatus, string> = {
  ACQUITTED: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
};
const STATUS_TONE: Record<NormStatus, Tone> = {
  ACQUITTED: "positive",
  PENDING: "warning",
  OVERDUE: "critical",
};

function normStatus(s: string | null | undefined): NormStatus {
  const v = (s ?? "").toUpperCase();
  if (v === "ACQUITTED" || v === "PAID" || v === "PAGO") return "ACQUITTED";
  if (v === "OVERDUE" || v === "VENCIDO" || v === "ATRASADO") return "OVERDUE";
  return "PENDING";
}

const tickFmt = (n: number) =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
const tooltipFmt = (v: number | string) =>
  typeof v === "number" ? BRL.format(v) : v;

type Item = {
  kind: "receita" | "despesa";
  id: string;
  descricao: string;
  party: string;
  categoria: string;
  centroCusto: string;
  valor: number;
  vencimento: string | null;
  pagamento: string | null;
  status: NormStatus;
};

function toItem(kind: "receita" | "despesa", r: ReceitaRow | DespesaRow): Item {
  const isReceita = kind === "receita";
  return {
    kind,
    id: r.id,
    descricao: r.descricao ?? "—",
    party:
      (isReceita
        ? (r as ReceitaRow).cliente_nome
        : (r as DespesaRow).fornecedor_nome) ?? "—",
    categoria: r.categoria_nome ?? "Sem categoria",
    centroCusto: r.centro_de_custo_nome ?? "Não alocado",
    valor: Number(r.total) || 0,
    vencimento: r.data_vencimento ?? r.data_competencia,
    pagamento: null,
    status: normStatus(r.status),
  };
}

function DashboardPage() {
  const [receitas, setReceitas] = useState<Item[]>([]);
  const [despesas, setDespesas] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const now = new Date();
  const [year, setYear] = useState<string>("2023");
  const [month, setMonth] = useState<string>("all");
  const [categoria, setCategoria] = useState<string>("all");
  const [centro, setCentro] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [pageReceitas, setPageReceitas] = useState(1);
  const [pageDespesas, setPageDespesas] = useState(1);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    const [r, d] = await Promise.all([
      supabase.from("receitas").select("*").limit(5000),
      supabase.from("despesas").select("*").limit(5000),
    ]);
    setReceitas((r.data ?? []).map((row) => toItem("receita", row as ReceitaRow)));
    setDespesas((d.data ?? []).map((row) => toItem("despesa", row as DespesaRow)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "receitas" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "despesas" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const all = useMemo(() => [...receitas, ...despesas], [receitas, despesas]);

  const years = useMemo(() => {
    const s = new Set<string>();
    for (const it of all) {
      const d = it.vencimento ?? it.pagamento;
      if (d) s.add(String(new Date(d).getFullYear()));
    }
    s.add(String(now.getFullYear()));
    return [...s].sort().reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    all.forEach((i) => s.add(i.categoria));
    return [...s].sort();
  }, [all]);

  const centros = useMemo(() => {
    const s = new Set<string>();
    all.forEach((i) => s.add(i.centroCusto));
    return [...s].sort();
  }, [all]);

  function inFilter(it: Item) {
    const d = it.vencimento ?? it.pagamento;
    if (!d) return false;
    const dt = new Date(d);
    if (String(dt.getFullYear()) !== year) return false;
    if (month !== "all" && dt.getMonth() !== Number(month)) return false;
    if (categoria !== "all" && it.categoria !== categoria) return false;
    if (centro !== "all" && it.centroCusto !== centro) return false;
    if (status !== "all" && it.status !== status) return false;
    return true;
  }

  const fReceitas = useMemo(() => receitas.filter(inFilter), [receitas, year, month, categoria, centro, status]);
  const fDespesas = useMemo(() => despesas.filter(inFilter), [despesas, year, month, categoria, centro, status]);

  // KPIs
  const totalReceitas = fReceitas.reduce((a, b) => a + b.valor, 0);
  const totalDespesas = fDespesas.reduce((a, b) => a + b.valor, 0);
  const resultado = totalReceitas - totalDespesas;
  const aReceber = fReceitas
    .filter((i) => i.status !== "ACQUITTED")
    .reduce((a, b) => a + b.valor, 0);
  const aPagar = fDespesas
    .filter((i) => i.status !== "ACQUITTED")
    .reduce((a, b) => a + b.valor, 0);

  // Monthly chart (current year, respects categoria/centro/status filters)
  const monthly = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS_PT[i],
      Receitas: 0,
      Despesas: 0,
      Saldo: 0,
    }));
    function bucketize(items: Item[], key: "Receitas" | "Despesas") {
      for (const it of items) {
        const d = it.vencimento ?? it.pagamento;
        if (!d) continue;
        const dt = new Date(d);
        if (String(dt.getFullYear()) !== year) continue;
        if (categoria !== "all" && it.categoria !== categoria) continue;
        if (centro !== "all" && it.centroCusto !== centro) continue;
        if (status !== "all" && it.status !== status) continue;
        buckets[dt.getMonth()][key] += it.valor;
      }
    }
    bucketize(receitas, "Receitas");
    bucketize(despesas, "Despesas");
    let acc = 0;
    for (const b of buckets) {
      acc += b.Receitas - b.Despesas;
      b.Saldo = acc;
    }
    return buckets;
  }, [receitas, despesas, year, categoria, centro, status]);

  // DRE by category
  const dre = useMemo(() => {
    const map = new Map<string, { categoria: string; receitas: number; despesas: number }>();
    for (const it of fReceitas) {
      const cur = map.get(it.categoria) ?? { categoria: it.categoria, receitas: 0, despesas: 0 };
      cur.receitas += it.valor;
      map.set(it.categoria, cur);
    }
    for (const it of fDespesas) {
      const cur = map.get(it.categoria) ?? { categoria: it.categoria, receitas: 0, despesas: 0 };
      cur.despesas += it.valor;
      map.set(it.categoria, cur);
    }
    return [...map.values()]
      .map((r) => ({ ...r, resultado: r.receitas - r.despesas }))
      .sort((a, b) => Math.abs(b.receitas + b.despesas) - Math.abs(a.receitas + a.despesas));
  }, [fReceitas, fDespesas]);

  const topDespesaCat = useMemo(() => {
    const m = new Map<string, number>();
    fDespesas.forEach((i) => m.set(i.categoria, (m.get(i.categoria) ?? 0) + i.valor));
    return [...m.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [fDespesas]);

  const topClientes = useMemo(() => {
    const m = new Map<string, number>();
    fReceitas.forEach((i) => m.set(i.party, (m.get(i.party) ?? 0) + i.valor));
    return [...m.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [fReceitas]);

  const abertasReceitas = useMemo(
    () =>
      fReceitas
        .filter((i) => i.status !== "ACQUITTED")
        .sort((a, b) => (a.vencimento ?? "").localeCompare(b.vencimento ?? "")),
    [fReceitas],
  );
  const abertasDespesas = useMemo(
    () =>
      fDespesas
        .filter((i) => i.status !== "ACQUITTED")
        .sort((a, b) => (a.vencimento ?? "").localeCompare(b.vencimento ?? "")),
    [fDespesas],
  );

  function paginate<T>(arr: T[], page: number) {
    const start = (page - 1) * pageSize;
    return { rows: arr.slice(start, start + pageSize), total: arr.length, pages: Math.max(1, Math.ceil(arr.length / pageSize)) };
  }

  const pagR = paginate(fReceitas, pageReceitas);
  const pagD = paginate(fDespesas, pageDespesas);

  return (
    <>
      <PageHeader
        title="Dashboard Financeiro"
        description="Receitas, despesas e contas em aberto com sincronização ao vivo."
      />

      {/* Filters */}
      <Card className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 rounded-2xl p-4">
        <FilterSelect label="Ano" value={year} onChange={setYear} options={years.map((y) => ({ value: y, label: y }))} />
        <FilterSelect
          label="Mês"
          value={month}
          onChange={setMonth}
          options={[{ value: "all", label: "Todos" }, ...MONTHS_PT.map((m, i) => ({ value: String(i), label: m }))]}
        />
        <FilterSelect
          label="Categoria"
          value={categoria}
          onChange={setCategoria}
          options={[{ value: "all", label: "Todas" }, ...categorias.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          label="Centro de custo"
          value={centro}
          onChange={setCentro}
          options={[{ value: "all", label: "Todos" }, ...centros.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Todos" },
            { value: "ACQUITTED", label: "Pago / Recebido" },
            { value: "PENDING", label: "Pendente" },
            { value: "OVERDUE", label: "Vencido" },
          ]}
        />
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Total Receitas" value={totalReceitas} icon={<TrendingUp className="h-5 w-5" />} tone="positive" />
        <Kpi label="Total Despesas" value={totalDespesas} icon={<TrendingDown className="h-5 w-5" />} tone="critical" />
        <Kpi
          label="Resultado Líquido"
          value={resultado}
          icon={<Scale className="h-5 w-5" />}
          tone={resultado >= 0 ? "positive" : "critical"}
        />
        <Kpi label="A Receber" value={aReceber} icon={<ArrowDownCircle className="h-5 w-5" />} tone="warning" />
        <Kpi label="A Pagar" value={aPagar} icon={<ArrowUpCircle className="h-5 w-5" />} tone="warning" />
      </div>

      {/* Monthly chart */}
      <div className="mt-6">
        <ChartCard title="Receitas vs Despesas por mês" subtitle={`Ano ${year} • linha = saldo acumulado`}>
          {monthly.every((m) => m.Receitas === 0 && m.Despesas === 0) ? (
            <EmptyState title="Sem dados no período" description="Aguarde sincronização ou ajuste filtros." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis tickFormatter={tickFmt} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip formatter={tooltipFmt} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="Receitas" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Saldo" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* DRE */}
      <Card className="mt-6 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">DRE simplificado por categoria</h3>
        {dre.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dre.map((r) => (
                <TableRow key={r.categoria}>
                  <TableCell>{r.categoria}</TableCell>
                  <TableCell className="text-right tabular-nums text-[color:var(--success)]">{BRL.format(r.receitas)}</TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">{BRL.format(r.despesas)}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${r.resultado >= 0 ? "text-[color:var(--success)]" : "text-destructive"}`}>
                    {BRL.format(r.resultado)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-secondary/40 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{BRL.format(totalReceitas)}</TableCell>
                <TableCell className="text-right tabular-nums">{BRL.format(totalDespesas)}</TableCell>
                <TableCell className={`text-right tabular-nums ${resultado >= 0 ? "text-[color:var(--success)]" : "text-destructive"}`}>
                  {BRL.format(resultado)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Top rankings */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top despesas por categoria">
          <HorizontalBarsChart data={topDespesaCat} />
        </ChartCard>
        <ChartCard title="Top clientes por receita">
          <HorizontalBarsChart data={topClientes} />
        </ChartCard>
      </div>

      {/* Open accounts */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OpenList title="Receitas em aberto" rows={abertasReceitas.slice(0, 10)} partyLabel="Cliente" />
        <OpenList title="Despesas em aberto" rows={abertasDespesas.slice(0, 10)} partyLabel="Fornecedor" />
      </div>

      {/* Detail tables */}
      <DetailTable
        className="mt-6"
        title="Receitas — detalhamento"
        rows={pagR.rows}
        page={pageReceitas}
        pages={pagR.pages}
        total={pagR.total}
        onPage={setPageReceitas}
        partyLabel="Cliente"
      />
      <DetailTable
        className="mt-6"
        title="Despesas — detalhamento"
        rows={pagD.rows}
        page={pageDespesas}
        pages={pagD.pages}
        total={pagD.total}
        onPage={setPageDespesas}
        partyLabel="Fornecedor"
      />

      {loading && !all.length ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando dados…</p>
      ) : null}
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "positive" | "critical" | "warning" | "neutral";
}) {
  const color =
    tone === "positive"
      ? "text-[color:var(--success)]"
      : tone === "critical"
        ? "text-destructive"
        : tone === "warning"
          ? "text-[color:var(--warning)]"
          : "text-primary";
  return (
    <Card className="rounded-2xl border-border p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={color}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-semibold tabular-nums ${color}`}>{BRL.format(value)}</p>
    </Card>
  );
}

function OpenList({
  title,
  rows,
  partyLabel,
}: {
  title: string;
  rows: Item[];
  partyLabel: string;
}) {
  return (
    <Card className="rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState title="Nada em aberto" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{partyLabel}</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.kind}-${r.id}`}>
                <TableCell className="max-w-[200px] truncate">{r.party}</TableCell>
                <TableCell>{r.vencimento ? formatDate(r.vencimento) : "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{BRL.format(r.valor)}</TableCell>
                <TableCell>
                  <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function DetailTable({
  className,
  title,
  rows,
  page,
  pages,
  total,
  onPage,
  partyLabel,
}: {
  className?: string;
  title: string;
  rows: Item[];
  page: number;
  pages: number;
  total: number;
  onPage: (n: number) => void;
  partyLabel: string;
}) {
  return (
    <Card className={`rounded-2xl p-5 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{total} registros</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>{partyLabel}</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.kind}-${r.id}`}>
                  <TableCell className="max-w-[280px] truncate">{r.descricao}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{r.party}</TableCell>
                  <TableCell>{r.categoria}</TableCell>
                  <TableCell className="text-right tabular-nums">{BRL.format(r.valor)}</TableCell>
                  <TableCell>
                    <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge>
                  </TableCell>
                  <TableCell>{r.vencimento ? formatDate(r.vencimento) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {page} de {pages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
              Próxima
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Maximize2,
  ChevronRight,
  Target,
  Activity,
  Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Area,
  AreaChart
} from "recharts";
import { useFilters } from "@/context/FiltersContext";
import { getTransactions, getMonthlyKpis } from "@/lib/finance";
import { BRL, MONTHS_PT } from "@/lib/format";
import { YEARS } from "@/data/mock";
import { parseLocalDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "DRE Financeiro — Premium Dashboard" },
      { name: "description", content: "Demonstrativo de Resultados do Exercício com visual premium." },
    ],
  }),
  component: DreDashboardPage,
});

const tickFmt = (n: number) =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);

const tooltipFmt = (v: number | string) =>
  typeof v === "number" ? BRL.format(v) : v;

function DreDashboardPage() {
  const filters = useFilters();
  const txs = useMemo(() => getTransactions(filters), [filters]);
  
  // Data processing (preserving existing logic)
  const stats = useMemo(() => {
    const kpis = getMonthlyKpis(filters);
    const sum = (sel: (k: any) => number) => kpis.reduce((acc: number, cur: any) => acc + sel(cur), 0);
    
    const grossRevenue = sum(k => k.grossRevenue);
    const taxes = sum(k => k.taxes);
    const commissions = sum(k => k.commissions);
    const netRevenue = sum(k => k.netRevenue);
    const operationalCosts = sum(k => k.operationalCosts);
    const operationalExpenses = sum(k => k.operationalExpenses);
    const ebitda = sum(k => k.ebitda);
    const netProfit = sum(k => k.netProfit);
    
    return {
      receita: grossRevenue,
      taxes,
      commissions,
      netRevenue,
      operationalCosts,
      despesa: operationalCosts + operationalExpenses,
      lucroBruto: netRevenue - operationalCosts,
      ebitda,
      lucroLiquido: netProfit,
      margemLiquida: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
      margemEbitda: netRevenue > 0 ? (ebitda / netRevenue) * 100 : 0
    };
  }, [filters]);

  const monthly = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS_PT[i].substring(0, 3),
      Receitas: 0,
      Despesas: 0,
      Lucro: 0,
    }));
    
    txs.forEach(t => {
      const dt = parseLocalDate(t.date);
      if (dt) {
        const m = dt.getMonth();
        if (t.type === 'revenue') buckets[m].Receitas += t.amount;
        else buckets[m].Despesas += t.amount;
      }
    });
    
    buckets.forEach(b => b.Lucro = b.Receitas - b.Despesas);
    return buckets;
  }, [txs]);

  const dreRows = useMemo(() => {
    const map = new Map<string, { categoria: string; receitas: number; despesas: number; transactions: any[] }>();
    txs.forEach(t => {
      const cur = map.get(t.category) ?? { categoria: t.category, receitas: 0, despesas: 0, transactions: [] };
      if (t.type === 'revenue') cur.receitas += t.amount;
      else cur.despesas += t.amount;
      cur.transactions.push(t);
      map.set(t.category, cur);
    });
    return [...map.values()].map(r => ({ ...r, resultado: r.receitas - r.despesas }))
      .sort((a, b) => Math.abs(b.receitas + b.despesas) - Math.abs(a.receitas + a.despesas));
  }, [txs]);

  const extremes = useMemo(() => {
    if (txs.length === 0) return { maxR: 0, maxD: 0 };
    const maxR = Math.max(...txs.filter(t => t.type === 'revenue').map(t => t.amount), 0);
    const maxD = Math.max(...txs.filter(t => t.type === 'expense').map(t => t.amount), 0);
    return { maxR, maxD };
  }, [txs]);

  return (
    <div className="flex min-h-screen animate-in fade-in duration-500">
      <main className="flex-1 p-8 pt-6">
        {/* Header Executive Area */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">DRE Financeiro</h1>
            <p className="text-muted-foreground text-lg">Demonstrativo de Resultados do Exercício</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 rounded-xl border-border bg-card/50 px-4 transition-all hover:bg-secondary">
              <Calendar className="mr-2 h-4 w-4" />
              Período
            </Button>
            <Button variant="outline" className="h-11 rounded-xl border-border bg-card/50 px-4 transition-all hover:bg-secondary">
              <Zap className="mr-2 h-4 w-4" />
              Comparar
            </Button>
            <Button className="h-11 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:opacity-90">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content Area */}
          <div className="space-y-8 lg:col-span-3">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiPremium 
                label="Receita Líquida" 
                value={stats.receita} 
                trend={12.5} 
                icon={<TrendingUp className="text-blue-500" />} 
                sparklineColor="#3B82F6"
              />
              <KpiPremium 
                label="Lucro Bruto" 
                value={stats.lucroBruto} 
                trend={8.2} 
                icon={<BarChart3 className="text-emerald-500" />} 
                sparklineColor="#10B981"
              />
              <KpiPremium 
                label="EBITDA" 
                value={stats.ebitda} 
                trend={-2.4} 
                icon={<Activity className="text-amber-500" />} 
                sparklineColor="#F59E0B"
              />
              <KpiPremium 
                label="Lucro Líquido" 
                value={stats.lucroLiquido} 
                trend={15.8} 
                icon={<Zap className="text-violet-500" />} 
                sparklineColor="#8B5CF6"
              />
            </div>

            {/* Main Combined Chart */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
              <Card className="p-6 xl:col-span-3 border-border bg-card shadow-sm overflow-hidden group">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Evolução de Resultados</h3>
                  <Maximize2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
                <div className="h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} tickFormatter={tickFmt} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                        labelStyle={{ color: 'var(--muted-foreground)' }}
                        formatter={tooltipFmt}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                      <Area type="monotone" dataKey="Receitas" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                      <Bar dataKey="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                      <Line type="monotone" dataKey="Lucro" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#111827' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Side Indicators */}
              <div className="space-y-4">
                <IndicatorCard label="Margem Líquida" value={stats.margemLiquida.toFixed(1) + "%"} sub="vs 24.2% anterior" icon={<Target className="text-blue-500" />} />
                <IndicatorCard label="Margem EBITDA" value={stats.margemEbitda.toFixed(1) + "%"} sub="vs 31.0% anterior" icon={<Activity className="text-emerald-500" />} />
                <IndicatorCard label="Ponto de Equilíbrio" value={BRL.format(stats.despesa * 1.2)} sub="Estimado" icon={<ScalePremium className="text-amber-500" />} />
                <IndicatorCard label="Rentabilidade" value="18.5%" sub="Retorno s/ invest." icon={<PieChart className="text-violet-500" />} />
              </div>
            </div>

            {/* Premium DRE Table */}
            <Card className="overflow-hidden border-border bg-card shadow-sm">
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold">Detalhamento por Categoria</h3>
              </div>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/50 sticky top-0">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="w-[300px] py-5 font-bold text-foreground">Categoria</TableHead>
                      <TableHead className="text-right py-5 font-bold text-foreground">Receitas</TableHead>
                      <TableHead className="text-right py-5 font-bold text-foreground">Despesas</TableHead>
                      <TableHead className="text-right py-5 font-bold text-foreground">Resultado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dreRows.map((r, i) => (
                      <DreTableRow key={r.categoria} row={r} index={i} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right Summary Sidebar Area */}
          <aside className="space-y-8">
            <Card className="p-6 border-border bg-card shadow-sm space-y-6">
              <h3 className="text-lg font-bold border-b border-border pb-4">Resumo do Exercício</h3>
              <div className="space-y-4">
                <SummaryItem label="Faturamento Bruto" value={BRL.format(stats.receita)} numeric={stats.receita} />
                <SummaryItem label="(-) Impostos sobre Venda" value={BRL.format(-Math.abs(stats.taxes))} numeric={-Math.abs(stats.taxes)} dim />
                <SummaryItem label="(-) Comissões sobre Venda" value={BRL.format(-Math.abs(stats.commissions))} numeric={-Math.abs(stats.commissions)} dim />
                <SummaryItem label="Receita Líquida" value={BRL.format(stats.netRevenue)} numeric={stats.netRevenue} highlight />
                <SummaryItem label="(-) CPV / Custos Operacionais" value={BRL.format(-Math.abs(stats.operationalCosts))} numeric={-Math.abs(stats.operationalCosts)} dim />
                <SummaryItem label="Lucro Bruto" value={BRL.format(stats.lucroBruto)} numeric={stats.lucroBruto} highlight />
                <SummaryItem label="EBITDA" value={BRL.format(stats.ebitda)} numeric={stats.ebitda} />
                <SummaryItem label="Lucro Líquido" value={BRL.format(stats.lucroLiquido)} numeric={stats.lucroLiquido} highlight large />
              </div>

              <div className="pt-6 border-t border-border space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Melhor mês</span>
                  <span className="font-bold text-emerald-500 uppercase tracking-tighter">Outubro</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Maior Receita</span>
                  <span className="font-bold tabular-nums">{BRL.format(extremes.maxR)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Maior Despesa</span>
                  <span className="font-bold tabular-nums text-rose-500">{BRL.format(extremes.maxD)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-none bg-primary/5 shadow-sm overflow-hidden relative">
              <div className="relative z-10">
                <h4 className="font-bold text-foreground">Relatório Executivo</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Seu lucro cresceu 22% este mês.</p>
                <Button size="sm" className="w-full rounded-xl bg-white text-black hover:bg-white/90">Ver Detalhes</Button>
              </div>
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 bg-primary/20 rounded-full blur-2xl"></div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function DreTableRow({ row, index }: { row: any, index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group by sub-entity (party/description)
  const subRows = useMemo(() => {
    const subMap = new Map<string, number>();
    row.transactions.forEach((t: any) => {
      const key = t.party || "Outros";
      subMap.set(key, (subMap.get(key) || 0) + t.amount);
    });
    return [...subMap.entries()].map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [row.transactions]);

  return (
    <>
      <TableRow 
        className={cn(
          "group transition-colors border-border/30 hover:bg-primary/5 cursor-pointer",
          index % 2 === 0 ? "bg-transparent" : "bg-muted/10",
          isOpen && "bg-primary/5"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <TableCell className="py-4 font-medium flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
            <PieChart size={16} />
          </div>
          <span className="flex items-center gap-2">
            {row.categoria}
            <ChevronRight size={14} className={cn("transition-transform duration-200", isOpen && "rotate-90")} />
          </span>
        </TableCell>
        <TableCell className="text-right py-4 tabular-nums text-emerald-500 font-semibold">
          {BRL.format(row.receitas)}
        </TableCell>
        <TableCell className="text-right py-4 tabular-nums text-rose-500 font-semibold">
          {BRL.format(row.despesas)}
        </TableCell>
        <TableCell className={cn(
          "text-right py-4 tabular-nums font-bold",
          row.resultado >= 0 ? "text-emerald-500" : "text-rose-500"
        )}>
          {BRL.format(row.resultado)}
        </TableCell>
        <TableCell>
          <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
        </TableCell>
      </TableRow>
      
      {isOpen && subRows.map((sub, si) => (
        <TableRow key={`${row.categoria}-${sub.name}`} className="bg-muted/5 border-border/10 animate-in slide-in-from-top-1 duration-200">
          <TableCell className="py-3 pl-14 text-sm text-muted-foreground italic flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-border" />
            {sub.name}
          </TableCell>
          <TableCell className="text-right py-3 tabular-nums text-xs text-emerald-500/70 font-medium">
            {row.receitas > 0 ? BRL.format(sub.amount) : "—"}
          </TableCell>
          <TableCell className="text-right py-3 tabular-nums text-xs text-rose-500/70 font-medium">
            {row.despesas > 0 ? BRL.format(sub.amount) : "—"}
          </TableCell>
          <TableCell className="text-right py-3 tabular-nums text-xs text-muted-foreground font-medium">
            {BRL.format(sub.amount)}
          </TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

function KpiPremium({ label, value, trend, icon, sparklineColor }: { label: string, value: number, trend: number, icon: React.ReactNode, sparklineColor: string }) {
  return (
    <Card className="p-6 border-border bg-card shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend < 0 ? "-" : ""}{Math.abs(trend)}%
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <h4 className={cn("text-2xl font-bold tabular-nums", value < 0 && "text-rose-500")}>{BRL.format(value)}</h4>
      </div>
      {/* Mini Sparkline Mock */}
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div className="h-full bg-primary/20 w-full">
          <div className="h-full w-[70%]" style={{ backgroundColor: sparklineColor }}></div>
        </div>
      </div>
    </Card>
  );
}

function IndicatorCard({ label, value, sub, icon, numeric }: { label: string, value: string, sub: string, icon: React.ReactNode, numeric?: number }) {
  return (
    <Card className="p-4 border-border bg-card/50 transition-all hover:bg-secondary/50 flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
        <p className={cn("text-lg font-bold tabular-nums", numeric != null && numeric < 0 && "text-rose-500")}>{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
      </div>
    </Card>
  );
}

function SummaryItem({ label, value, highlight = false, dim = false, large = false, numeric }: { label: string, value: string, highlight?: boolean, dim?: boolean, large?: boolean, numeric?: number }) {
  const isNegative = numeric != null && numeric < 0;
  return (
    <div className="flex items-center justify-between">
      <span className={cn(
        "text-sm font-medium",
        dim ? "text-muted-foreground" : "text-foreground"
      )}>{label}</span>
      <span className={cn(
        "tabular-nums font-bold",
        highlight && !large ? "text-primary" : "",
        large ? "text-xl text-primary" : "text-sm",
        isNegative && "text-rose-500"
      )}>{value}</span>
    </div>
  );
}

function ScalePremium({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/>
    </svg>
  );
}

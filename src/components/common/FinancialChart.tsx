import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { BRL } from "@/lib/format";
import { EmptyState } from "./EmptyState";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tickFmt = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n));

const tooltipFmt = (v: number | string) => (typeof v === "number" ? BRL.format(v) : v);

type ChartDatum = Record<string, number | string>;

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="h-72 w-full">{children}</div>
    </Card>
  );
}

export function MultiBarChart({
  data,
  xKey,
  series,
}: {
  data: ChartDatum[];
  xKey: string;
  series: { key: string; name: string; color?: string }[];
}) {
  if (data.length === 0)
    return (
      <EmptyState
        title="Sem dados no período"
        description="Ajuste os filtros ou selecione outro intervalo."
        actionLabel="Revisar filtros"
      />
    );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis fontSize={12} tickFormatter={tickFmt} stroke="var(--muted-foreground)" />
        <Tooltip
          formatter={tooltipFmt}
          contentStyle={{
            borderRadius: 12,
            borderColor: "var(--border)",
            boxShadow: "0 10px 30px -16px rgb(15 23 42 / 0.35)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color ?? COLORS[i % COLORS.length]}
            radius={[6, 6, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineSeriesChart({
  data,
  xKey,
  series,
}: {
  data: ChartDatum[];
  xKey: string;
  series: { key: string; name: string; color?: string }[];
}) {
  if (data.length === 0)
    return (
      <EmptyState
        title="Sem dados no período"
        description="Ajuste os filtros ou selecione outro intervalo."
      />
    );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis fontSize={12} tickFormatter={tickFmt} stroke="var(--muted-foreground)" />
        <Tooltip
          formatter={tooltipFmt}
          contentStyle={{ borderRadius: 12, borderColor: "var(--border)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color ?? COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaSeriesChart({
  data,
  xKey,
  areaKey,
  name,
  color,
}: {
  data: ChartDatum[];
  xKey: string;
  areaKey: string;
  name: string;
  color?: string;
}) {
  if (data.length === 0)
    return (
      <EmptyState
        title="Sem dados no período"
        description="Ajuste os filtros ou selecione outro intervalo."
      />
    );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis fontSize={12} tickFormatter={tickFmt} stroke="var(--muted-foreground)" />
        <Tooltip
          formatter={tooltipFmt}
          contentStyle={{ borderRadius: 12, borderColor: "var(--border)" }}
        />
        <Area
          type="monotone"
          dataKey={areaKey}
          name={name}
          stroke={color ?? "var(--chart-1)"}
          fill={color ?? "var(--chart-1)"}
          fillOpacity={0.18}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarsChart({
  data,
  nameKey = "name",
  valueKey = "amount",
}: {
  data: ChartDatum[];
  nameKey?: string;
  valueKey?: string;
}) {
  if (data.length === 0)
    return (
      <EmptyState
        title="Sem dados no período"
        description="Ajuste os filtros ou selecione outro intervalo."
      />
    );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={tickFmt}
          stroke="var(--muted-foreground)"
        />
        <YAxis
          type="category"
          dataKey={nameKey}
          fontSize={12}
          width={140}
          stroke="var(--muted-foreground)"
        />
        <Tooltip
          formatter={tooltipFmt}
          contentStyle={{ borderRadius: 12, borderColor: "var(--border)" }}
        />
        <Bar dataKey={valueKey} radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  nameKey = "name",
  valueKey = "amount",
}: {
  data: ChartDatum[];
  nameKey?: string;
  valueKey?: string;
}) {
  if (data.length === 0)
    return (
      <EmptyState
        title="Sem dados no período"
        description="Ajuste os filtros ou selecione outro intervalo."
      />
    );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          formatter={tooltipFmt}
          contentStyle={{ borderRadius: 12, borderColor: "var(--border)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

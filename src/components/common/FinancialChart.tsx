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

const tickFmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
};

const tooltipFmt = (v: number | string) => (typeof v === "number" ? BRL.format(v) : v);

const AXIS = {
  fontSize: 11,
  stroke: "var(--muted-foreground)",
  tickLine: false as const,
  axisLine: false as const,
};

type ChartDatum = Record<string, number | string>;

type TooltipPayload = { name?: string; value?: number | string; color?: string }[];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-xl border border-border/70 bg-popover/95 p-3 shadow-lg backdrop-blur">
      {label != null ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: item.color ?? "var(--primary)" }}
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {tooltipFmt(item.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegend({ payload }: { payload?: TooltipPayload }) {
  if (!payload?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {payload.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.name}
        </span>
      ))}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card p-5 shadow-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
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
      <BarChart data={data} barGap={2} barCategoryGap="22%" margin={{ top: 8, right: 4, left: -12 }}>
        <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} dy={6} />
        <YAxis {...AXIS} tickFormatter={tickFmt} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.35 }} />
        <Legend content={<ChartLegend />} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color ?? COLORS[i % COLORS.length]}
            radius={[5, 5, 0, 0]}
            maxBarSize={26}
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
      <LineChart data={data} margin={{ top: 8, right: 4, left: -12 }}>
        <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} dy={6} />
        <YAxis {...AXIS} tickFormatter={tickFmt} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Legend content={<ChartLegend />} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color ?? COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
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
  const stroke = color ?? "var(--chart-1)";
  const gradientId = `area-${areaKey.replace(/\W/g, "")}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} dy={6} />
        <YAxis {...AXIS} tickFormatter={tickFmt} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey={areaKey}
          name={name}
          stroke={stroke}
          fill={`url(#${gradientId})`}
          strokeWidth={2.5}
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

  const max = Math.max(...data.map((d) => Math.abs(Number(d[valueKey]) || 0)), 1);

  return (
    <div className="flex h-full flex-col justify-center gap-3.5 pr-1">
      {data.map((d, i) => {
        const value = Number(d[valueKey]) || 0;
        const pct = (Math.abs(value) / max) * 100;
        const color = COLORS[i % COLORS.length];
        return (
          <div key={`${d[nameKey]}-${i}`} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="truncate">{String(d[nameKey])}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                {BRL.format(value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max(pct, 2)}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
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
        <Tooltip content={<ChartTooltip />} />
        <Legend content={<ChartLegend />} />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius={64}
          outerRadius={96}
          paddingAngle={3}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

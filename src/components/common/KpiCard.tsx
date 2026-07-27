import { ArrowDownRight, ArrowUpRight, HelpCircle, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatBRL, formatVariation } from "@/lib/format";

export type KpiTone = "positive" | "warning" | "critical" | "neutral";

export function KpiCard({
  label,
  value,
  variation,
  tone = "neutral",
  icon: Icon,
  formatValue,
  formula,
  trend,
}: {
  label: string;
  value: number | null;
  variation?: number | null;
  tone?: KpiTone;
  icon?: LucideIcon;
  formatValue?: (n: number) => string;
  formula?: string;
  trend?: number[];
}) {
  const positive = (variation ?? 0) >= 0;
  const dotColor =
    tone === "positive"
      ? "bg-[color:var(--success)]"
      : tone === "warning"
        ? "bg-[color:var(--warning)]"
        : tone === "critical"
          ? "bg-destructive"
          : "bg-primary";

  return (
    <Card className="rounded-2xl border-border p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />
          <p className="min-w-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {formula ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Ver fórmula de ${label}`}
                    className="rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64 bg-foreground text-background">
                  {formula}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" /> : null}
      </div>
      <p className={cn("mt-3 text-2xl font-semibold", (value ?? 0) < 0 ? "text-destructive" : "text-foreground")}>
        {value == null ? "—" : formatValue ? formatValue(value) : formatBRL(value)}
      </p>
      {trend?.length ? (
        <div className="mt-3 flex h-8 items-end gap-1" aria-label="Mini tendência">
          {trend.map((v, i) => {
            const max = Math.max(...trend.map(Math.abs), 1);
            return (
              <span
                key={i}
                className={cn("w-full rounded-t-sm", dotColor)}
                style={{ height: `${Math.max(18, (Math.abs(v) / max) * 100)}%` }}
              />
            );
          })}
        </div>
      ) : null}
      {variation != null && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            positive ? "text-[color:var(--success)]" : "text-destructive",
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {formatVariation(variation)}
          <span className="text-muted-foreground font-normal">vs período anterior</span>
        </div>
      )}
    </Card>
  );
}
